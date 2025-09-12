#!/bin/bash

# 性能テスト統合実行スクリプト
# 使用方法: ./run-performance-tests.sh [options]
# Options:
#   --setup         テストデータのセットアップを実行
#   --cleanup       テスト後のクリーンアップを実行
#   --test <name>   特定のテストのみ実行
#   --all          すべてのテストを実行（デフォルト）
#   --analyze      結果の分析のみ実行
#   --ci           CI環境用の設定で実行

set -e

# カラー出力の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 設定
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K6_DIR="$SCRIPT_DIR/k6"
UTILS_DIR="$SCRIPT_DIR/utils"
RESULTS_DIR="$SCRIPT_DIR/results"
REPORTS_DIR="$SCRIPT_DIR/reports"

# 環境変数の設定
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
export TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-Test1234!}"
export NODE_ENV="${NODE_ENV:-test}"

# 結果ディレクトリの作成
mkdir -p "$RESULTS_DIR"
mkdir -p "$REPORTS_DIR"

# ヘルパー関数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# k6がインストールされているか確認
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first."
        echo "Installation instructions: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    print_success "k6 is installed: $(k6 version)"
}

# Node.jsとnpmの確認
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed."
        exit 1
    fi
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_success "Node.js: $(node --version), npm: $(npm --version)"
}

# 依存関係のインストール
install_dependencies() {
    print_header "Installing Dependencies"
    cd "$PROJECT_ROOT"
    
    # 必要なパッケージがインストールされているか確認
    if ! npm list @faker-js/faker &> /dev/null; then
        print_warning "Installing @faker-js/faker..."
        npm install --save-dev @faker-js/faker
    fi
    
    if ! npm list bcryptjs &> /dev/null; then
        print_warning "Installing bcryptjs..."
        npm install bcryptjs
    fi
    
    if ! npm list @types/bcryptjs &> /dev/null; then
        print_warning "Installing @types/bcryptjs..."
        npm install --save-dev @types/bcryptjs
    fi
    
    print_success "Dependencies installed"
}

# テストデータのセットアップ
setup_test_data() {
    print_header "Setting Up Test Data"
    cd "$PROJECT_ROOT"
    
    # Prismaのマイグレーション実行
    print_warning "Running database migrations..."
    npx prisma migrate deploy
    
    # 大量テストデータの生成
    print_warning "Generating test data..."
    npx ts-node "$UTILS_DIR/seed-large-dataset.ts" 100 500 90
    
    print_success "Test data setup completed"
}

# テストデータのクリーンアップ
cleanup_test_data() {
    print_header "Cleaning Up Test Data"
    cd "$PROJECT_ROOT"
    
    npx ts-node "$UTILS_DIR/cleanup-test-data.ts"
    
    print_success "Test data cleaned up"
}

# 個別のk6テスト実行
run_k6_test() {
    local test_name=$1
    local test_file="$K6_DIR/${test_name}.js"
    
    if [ ! -f "$test_file" ]; then
        print_error "Test file not found: $test_file"
        return 1
    fi
    
    print_warning "Running test: $test_name"
    
    # k6テストの実行と結果の保存
    k6 run \
        --out json="$RESULTS_DIR/${test_name}-raw.json" \
        --summary-export="$RESULTS_DIR/${test_name}-summary.json" \
        "$test_file"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Test $test_name completed successfully"
    else
        print_error "Test $test_name failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# すべてのテストを実行
run_all_tests() {
    print_header "Running All Performance Tests"
    
    local tests=(
        "api-response-time"
        "reports-list-performance"
        "reports-create-performance"
        "search-performance"
        "concurrent-load-test"
    )
    
    local failed_tests=()
    
    for test in "${tests[@]}"; do
        if ! run_k6_test "$test"; then
            failed_tests+=("$test")
        fi
        
        # テスト間で少し待機
        sleep 2
    done
    
    echo
    print_header "Test Summary"
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_success "All tests passed!"
        return 0
    else
        print_error "Failed tests: ${failed_tests[*]}"
        return 1
    fi
}

# 結果の分析
analyze_results() {
    print_header "Analyzing Test Results"
    cd "$PROJECT_ROOT"
    
    npx ts-node "$UTILS_DIR/analyze-results.ts"
    
    print_success "Analysis completed. Reports saved in $REPORTS_DIR"
}

# CI環境用の実行
run_ci_mode() {
    print_header "Running in CI Mode"
    
    # サーバーが起動しているか確認
    if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        print_error "Server is not running at $BASE_URL"
        exit 1
    fi
    
    # テストデータのセットアップ
    setup_test_data
    
    # すべてのテストを実行
    run_all_tests
    local test_result=$?
    
    # 結果の分析
    analyze_results
    
    # クリーンアップ
    cleanup_test_data
    
    # CI用の結果ファイルを生成
    if [ $test_result -eq 0 ]; then
        echo "PASS" > "$RESULTS_DIR/ci-result.txt"
    else
        echo "FAIL" > "$RESULTS_DIR/ci-result.txt"
    fi
    
    exit $test_result
}

# メイン処理
main() {
    print_header "Performance Test Runner"
    
    # 環境チェック
    check_k6
    check_node
    install_dependencies
    
    # コマンドライン引数の処理
    case "${1:-}" in
        --setup)
            setup_test_data
            ;;
        --cleanup)
            cleanup_test_data
            ;;
        --test)
            if [ -z "${2:-}" ]; then
                print_error "Test name required"
                exit 1
            fi
            run_k6_test "$2"
            ;;
        --analyze)
            analyze_results
            ;;
        --ci)
            run_ci_mode
            ;;
        --all|"")
            # サーバーが起動しているか確認
            if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
                print_warning "Server is not running at $BASE_URL"
                print_warning "Please start the server before running tests"
                exit 1
            fi
            
            run_all_tests
            analyze_results
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --setup         Setup test data"
            echo "  --cleanup       Cleanup test data"
            echo "  --test <name>   Run specific test"
            echo "  --all          Run all tests (default)"
            echo "  --analyze      Analyze results only"
            echo "  --ci           Run in CI mode"
            echo "  --help         Show this help message"
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    
    print_success "Done!"
}

# スクリプトの実行
main "$@"