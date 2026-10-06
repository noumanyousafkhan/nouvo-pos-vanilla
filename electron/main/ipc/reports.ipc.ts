import { handle } from './index'
import { ReportService } from '../services/reports/ReportService'

export function registerReportsIpc(): void {
  handle('reports:kpis', (filters) => ReportService.getKpis(filters))
  handle('reports:salesChart', (filters) => ReportService.getSalesChart(filters))
  handle('reports:topProducts', (filters) => ReportService.getTopProducts(filters))
  handle('reports:categoryPerformance', (filters) => ReportService.getCategoryPerformance(filters))
  handle('reports:paymentBreakdown', (filters) => ReportService.getPaymentBreakdown(filters))
  handle('reports:itemsPerformance', (filters) => ReportService.getItemsPerformance(filters))
  handle('reports:recentTransactions', (filters) => ReportService.getRecentTransactions(filters))
  handle('reports:score', (filters) => ReportService.getScore(filters))
  handle('reports:fullDashboard', (filters) => ReportService.getFullDashboard(filters))
}
