import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CleanupOptions {
  preserveBasicData?: boolean;  // 基本的なマスタデータを残すか
  salesPersonPattern?: string;  // 削除する営業担当者のメールパターン
  customerPattern?: string;     // 削除する顧客の会社名パターン
  reportDateBefore?: Date;      // この日付より前の日報を削除
  dryRun?: boolean;             // 実際には削除せず、削除対象を表示するのみ
}

const defaultOptions: CleanupOptions = {
  preserveBasicData: true,
  salesPersonPattern: 'sales%@example.com',
  customerPattern: '%テスト%',
  reportDateBefore: new Date(),
  dryRun: false,
};

async function cleanupTestData(options: CleanupOptions = defaultOptions) {
  console.log('🧹 Starting test data cleanup...');
  
  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be actually deleted');
  }
  
  try {
    // 現在の統計情報を取得
    const beforeStats = await getStatistics();
    console.log('\n📊 Before Cleanup:');
    displayStatistics(beforeStats);
    
    // トランザクション内で削除を実行
    const result = await prisma.$transaction(async (tx) => {
      const deletedCounts = {
        managerComments: 0,
        visitRecords: 0,
        dailyReports: 0,
        customers: 0,
        salesPersons: 0,
      };
      
      // 1. 管理者コメントの削除
      console.log('\n🗑️  Cleaning manager comments...');
      if (options.reportDateBefore) {
        const commentsToDelete = await tx.managerComment.findMany({
          where: {
            report: {
              reportDate: {
                lt: options.reportDateBefore,
              },
            },
          },
          select: { id: true },
        });
        
        if (!options.dryRun && commentsToDelete.length > 0) {
          const deleted = await tx.managerComment.deleteMany({
            where: {
              id: {
                in: commentsToDelete.map(c => c.id),
              },
            },
          });
          deletedCounts.managerComments = deleted.count;
        } else {
          deletedCounts.managerComments = commentsToDelete.length;
        }
        
        console.log(`  Found ${commentsToDelete.length} comments to delete`);
      }
      
      // 2. 訪問記録の削除
      console.log('\n🗑️  Cleaning visit records...');
      if (options.reportDateBefore) {
        const visitsToDelete = await tx.visitRecord.findMany({
          where: {
            report: {
              reportDate: {
                lt: options.reportDateBefore,
              },
            },
          },
          select: { id: true },
        });
        
        if (!options.dryRun && visitsToDelete.length > 0) {
          const deleted = await tx.visitRecord.deleteMany({
            where: {
              id: {
                in: visitsToDelete.map(v => v.id),
              },
            },
          });
          deletedCounts.visitRecords = deleted.count;
        } else {
          deletedCounts.visitRecords = visitsToDelete.length;
        }
        
        console.log(`  Found ${visitsToDelete.length} visit records to delete`);
      }
      
      // 3. 日報の削除
      console.log('\n🗑️  Cleaning daily reports...');
      if (options.reportDateBefore) {
        const reportsToDelete = await tx.dailyReport.findMany({
          where: {
            reportDate: {
              lt: options.reportDateBefore,
            },
          },
          select: { id: true },
        });
        
        if (!options.dryRun && reportsToDelete.length > 0) {
          const deleted = await tx.dailyReport.deleteMany({
            where: {
              id: {
                in: reportsToDelete.map(r => r.id),
              },
            },
          });
          deletedCounts.dailyReports = deleted.count;
        } else {
          deletedCounts.dailyReports = reportsToDelete.length;
        }
        
        console.log(`  Found ${reportsToDelete.length} reports to delete`);
      }
      
      // 4. テスト顧客の削除
      console.log('\n🗑️  Cleaning test customers...');
      if (options.customerPattern) {
        const customersToDelete = await tx.customer.findMany({
          where: {
            companyName: {
              contains: options.customerPattern.replace(/%/g, ''),
            },
          },
          select: { id: true, companyName: true },
        });
        
        if (!options.dryRun && customersToDelete.length > 0) {
          // まず関連する訪問記録を削除
          await tx.visitRecord.deleteMany({
            where: {
              customerId: {
                in: customersToDelete.map(c => c.id),
              },
            },
          });
          
          // その後顧客を削除
          const deleted = await tx.customer.deleteMany({
            where: {
              id: {
                in: customersToDelete.map(c => c.id),
              },
            },
          });
          deletedCounts.customers = deleted.count;
        } else {
          deletedCounts.customers = customersToDelete.length;
        }
        
        console.log(`  Found ${customersToDelete.length} test customers to delete`);
        if (options.dryRun && customersToDelete.length > 0) {
          console.log(`  Sample: ${customersToDelete.slice(0, 3).map(c => c.companyName).join(', ')}...`);
        }
      }
      
      // 5. テスト営業担当者の削除
      console.log('\n🗑️  Cleaning test sales persons...');
      if (options.salesPersonPattern) {
        const salesPersonsToDelete = await tx.salesPerson.findMany({
          where: {
            email: {
              contains: options.salesPersonPattern.replace(/%/g, '').replace('@example.com', ''),
            },
          },
          select: { id: true, email: true, name: true },
        });
        
        // 基本データを保持する場合は、最初の数名を除外
        let finalSalesPersonsToDelete = salesPersonsToDelete;
        if (options.preserveBasicData) {
          finalSalesPersonsToDelete = salesPersonsToDelete.slice(5); // 最初の5名は残す
          console.log(`  Preserving first 5 sales persons for basic data`);
        }
        
        if (!options.dryRun && finalSalesPersonsToDelete.length > 0) {
          // まず関連するデータを削除
          const salesPersonIds = finalSalesPersonsToDelete.map(sp => sp.id);
          
          // 管理者コメントを削除
          await tx.managerComment.deleteMany({
            where: {
              managerId: {
                in: salesPersonIds,
              },
            },
          });
          
          // 日報（とその関連データ）を削除
          const reports = await tx.dailyReport.findMany({
            where: {
              salesPersonId: {
                in: salesPersonIds,
              },
            },
            select: { id: true },
          });
          
          if (reports.length > 0) {
            const reportIds = reports.map(r => r.id);
            
            await tx.managerComment.deleteMany({
              where: { reportId: { in: reportIds } },
            });
            
            await tx.visitRecord.deleteMany({
              where: { reportId: { in: reportIds } },
            });
            
            await tx.dailyReport.deleteMany({
              where: { id: { in: reportIds } },
            });
          }
          
          // 最後に営業担当者を削除
          const deleted = await tx.salesPerson.deleteMany({
            where: {
              id: {
                in: salesPersonIds,
              },
            },
          });
          deletedCounts.salesPersons = deleted.count;
        } else {
          deletedCounts.salesPersons = finalSalesPersonsToDelete.length;
        }
        
        console.log(`  Found ${finalSalesPersonsToDelete.length} test sales persons to delete`);
        if (options.dryRun && finalSalesPersonsToDelete.length > 0) {
          console.log(`  Sample: ${finalSalesPersonsToDelete.slice(0, 3).map(sp => `${sp.name} (${sp.email})`).join(', ')}...`);
        }
      }
      
      return deletedCounts;
    });
    
    // クリーンアップ後の統計情報
    const afterStats = await getStatistics();
    
    console.log('\n✅ Cleanup Summary:');
    console.log(`  Manager Comments: ${result.managerComments} deleted`);
    console.log(`  Visit Records: ${result.visitRecords} deleted`);
    console.log(`  Daily Reports: ${result.dailyReports} deleted`);
    console.log(`  Customers: ${result.customers} deleted`);
    console.log(`  Sales Persons: ${result.salesPersons} deleted`);
    
    console.log('\n📊 After Cleanup:');
    displayStatistics(afterStats);
    
    if (options.dryRun) {
      console.log('\n⚠️  DRY RUN COMPLETE - No data was actually deleted');
    } else {
      console.log('\n✨ Test data cleanup completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getStatistics() {
  const [salesPersons, managers, customers, reports, visitRecords, managerComments] = await Promise.all([
    prisma.salesPerson.count(),
    prisma.salesPerson.count({ where: { isManager: true } }),
    prisma.customer.count(),
    prisma.dailyReport.count(),
    prisma.visitRecord.count(),
    prisma.managerComment.count(),
  ]);
  
  return {
    salesPersons,
    managers,
    customers,
    reports,
    visitRecords,
    managerComments,
  };
}

function displayStatistics(stats: Awaited<ReturnType<typeof getStatistics>>) {
  console.log(`  Sales Persons: ${stats.salesPersons} (Managers: ${stats.managers})`);
  console.log(`  Customers: ${stats.customers}`);
  console.log(`  Reports: ${stats.reports}`);
  console.log(`  Visit Records: ${stats.visitRecords}`);
  console.log(`  Manager Comments: ${stats.managerComments}`);
}

async function resetDatabase() {
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n🔥 Resetting database...');
  
  try {
    // 全テーブルのデータを削除（依存関係の順序で）
    await prisma.$transaction([
      prisma.managerComment.deleteMany(),
      prisma.visitRecord.deleteMany(),
      prisma.dailyReport.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.salesPerson.deleteMany(),
    ]);
    
    console.log('✅ Database reset complete');
    
    const stats = await getStatistics();
    console.log('\n📊 Database is now empty:');
    displayStatistics(stats);
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLIから実行する場合
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    resetDatabase()
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } else if (command === 'dry-run') {
    cleanupTestData({ ...defaultOptions, dryRun: true })
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } else {
    const options: CleanupOptions = {
      ...defaultOptions,
      preserveBasicData: process.argv.includes('--preserve-basic'),
      dryRun: process.argv.includes('--dry-run'),
    };
    
    if (process.argv.includes('--before')) {
      const beforeIndex = process.argv.indexOf('--before');
      if (beforeIndex > -1 && process.argv[beforeIndex + 1]) {
        options.reportDateBefore = new Date(process.argv[beforeIndex + 1]);
      }
    }
    
    cleanupTestData(options)
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  }
}

export { cleanupTestData, resetDatabase, getStatistics, CleanupOptions };