import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables, ChartType } from 'chart.js';
import { DecimalPipe } from '@angular/common';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-finance-report',
  templateUrl: './finance-report.component.html',
  styleUrls: ['./finance-report.component.scss'],
  providers: [DecimalPipe],
})
export class FinanceReportComponent implements OnInit {
  @ViewChild('combinedChart', { static: true }) combinedChartRef: ElementRef | undefined;
  @ViewChild('expenseInput') expenseInput?: ElementRef;
  @ViewChild('incomeInput') incomeInput?: ElementRef;

  expenseData: any;
  incomeData: any;
  combinedChart: any;
  isDarkMode = false;
  expenseFile: File | null = null;
  incomeFile: File | null = null;
  mostProfitableMonth: string = '';
  leastProfitableMonth: string = '';
  totalProfit: number = 0;
  mostProfitAmount: number = 0;
  leastProfitAmount: number = 0;
  currencyCode: string = 'GBP';
  totalIncome: number = 0;
  totalExpense: number = 0;
  selectedIncomeSortOption = 'Sort By';
  selectedExpenseSortOption = 'Sort By';
  showIncomeSortDropdown = false;
  showExpenseSortDropdown = false;
  filteredExpenses: any[] = [];
  filteredIncomes: any[] = [];
  originalExpenses: any[] = [];
  originalIncomes: any[] = [];
  expenses: any[] = [];
  incomes: any[] = [];
  isLargeText = false;

  constructor(private decimalPipe: DecimalPipe) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {}

  goBack(): void {
    window.history.back();
  }

  onExpenseFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (this.incomeFile && this.isSameFile(file, this.incomeFile)) {
        alert('The selected expense file is the same as the income file. Please choose a different file.');
      } else if (this.expenseFile) {
        this.showWarningMessage('expense');
      } else {
        this.expenseFile = file;
        this.processExpenseFile(file);
        fileInput.parentElement?.classList.add('file-uploaded'); // Add the class to the button element
      }
    }
  }

  onIncomeFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (this.expenseFile && this.isSameFile(file, this.expenseFile)) {
        alert('The selected income file is the same as the expense file. Please choose a different file.');
      } else if (this.incomeFile) {
        this.showWarningMessage('income');
      } else {
        this.incomeFile = file;
        this.processIncomeFile(file);
        fileInput.parentElement?.classList.add('file-uploaded'); // Add the class to the button element
      }
    }
  }
  isSameFile(file1: File, file2: File): boolean {
    return file1.name === file2.name && file1.size === file2.size && file1.type === file2.type;
  }

  showWarningMessage(fileType: string) {
    const confirmation = confirm(`A ${fileType} file has already been imported. Do you want to replace it?`);
    if (confirmation) {
      if (fileType === 'expense') {
        this.expenseFile = null;
        if (this.expenseInput) {
          this.expenseInput.nativeElement.value = '';
          this.expenseInput.nativeElement.parentElement?.classList.remove('file-uploaded'); // Remove the class
        }
      } else if (fileType === 'income') {
        this.incomeFile = null;
        if (this.incomeInput) {
          this.incomeInput.nativeElement.value = '';
          this.incomeInput.nativeElement.parentElement?.classList.remove('file-uploaded'); // Remove the class
        }
      }
    }
  }
  processExpenseFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const fileContent = reader.result as string;
      this.expenseData = JSON.parse(fileContent);
      this.filteredExpenses = [...this.expenseData]; // Initialize filteredExpenses with the parsed data
      this.originalExpenses = [...this.expenseData];
      this.expenses = [...this.expenseData]; // Store the original order of expenses
      this.calculateTotalExpense(); // Update totalExpense
      this.generateCombinedChart();
    };

    reader.readAsText(file);
  }

  processIncomeFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const fileContent = reader.result as string;
      this.incomeData = JSON.parse(fileContent);
      this.filteredIncomes = [...this.incomeData]; // Initialize filteredIncomes with the parsed data
      this.originalIncomes = [...this.incomeData]; // Store the original order of incomes
      this.incomes = [...this.incomeData];
      this.calculateTotalIncome(); // Update totalIncome
      this.generateCombinedChart();
    };

    reader.readAsText(file);
  }

  calculateTotalExpense() {
    this.totalExpense = this.expenseData.reduce((total: number, item: any) => total + item.amount, 0);
  }

  calculateTotalIncome() {
    this.totalIncome = this.incomeData.reduce((total: number, item: any) => total + item.amount, 0);
  }

  toggleSortDropdown(type: 'income' | 'expense') {
    if (type === 'income') {
      this.showIncomeSortDropdown = !this.showIncomeSortDropdown;
    } else {
      this.showExpenseSortDropdown = !this.showExpenseSortDropdown;
    }
  }

  sortIncomes(option: string) {
    const monthOrder: { [key: string]: number } = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    switch (option) {
      case 'newest':
        this.filteredIncomes.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthA] - monthOrder[monthB];
        });
        this.selectedIncomeSortOption = 'Newest - Oldest';
        break;
      case 'oldest':
        this.filteredIncomes.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthB] - monthOrder[monthA];
        });
        this.selectedIncomeSortOption = 'Oldest - Newest';
        break;
      case 'amount-desc':
        this.filteredIncomes.sort((a, b) => b.amount - a.amount);
        this.selectedIncomeSortOption = 'Amount (Desc)';
        break;
      case 'amount-asc':
        this.filteredIncomes.sort((a, b) => a.amount - b.amount);
        this.selectedIncomeSortOption = 'Amount (Asc)';
        break;
      case 'name':
        this.filteredIncomes.sort((a, b) => {
          const nameA = a.name.match(/\d+|\D+/g);
          const nameB = b.name.match(/\d+|\D+/g);
          let i = 0;
          while (i < nameA.length && i < nameB.length) {
            if (isNaN(nameA[i]) && isNaN(nameB[i])) {
              const comparison = nameA[i].localeCompare(nameB[i]);
              if (comparison !== 0) {
                return comparison;
              }
            } else if (!isNaN(nameA[i]) && !isNaN(nameB[i])) {
              const numA = parseInt(nameA[i]);
              const numB = parseInt(nameB[i]);
              if (numA !== numB) {
                return numA - numB;
              }
            } else {
              return isNaN(nameA[i]) ? 1 : -1;
            }
            i++;
          }
          return nameA.length - nameB.length;
        });
        this.selectedIncomeSortOption = 'Name (A-Z)';
        break;
    }
    this.showIncomeSortDropdown = false;
    this.generateCombinedChart();
  }

  sortExpenses(option: string) {
    const monthOrder: { [key: string]: number } = {
      January: 1,
      February: 2,
      March: 3,
      April: 4,
      May: 5,
      June: 6,
      July: 7,
      August: 8,
      September: 9,
      October: 10,
      November: 11,
      December: 12,
    };

    switch (option) {
      case 'newest':
        this.filteredExpenses.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthA] - monthOrder[monthB];
        });
        this.selectedExpenseSortOption = 'Newest - Oldest';
        break;
      case 'oldest':
        this.filteredExpenses.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthB] - monthOrder[monthA];
        });
        this.selectedExpenseSortOption = 'Oldest - Newest';
        break;
      case 'amount-desc':
        this.filteredExpenses.sort((a, b) => b.amount - a.amount);
        this.selectedExpenseSortOption = 'Amount (Desc)';
        break;
      case 'amount-asc':
        this.filteredExpenses.sort((a, b) => a.amount - b.amount);
        this.selectedExpenseSortOption = 'Amount (Asc)';
        break;
      case 'name':
        this.filteredExpenses.sort((a, b) => {
          const nameA = a.name.match(/\d+|\D+/g);
          const nameB = b.name.match(/\d+|\D+/g);
          let i = 0;
          while (i < nameA.length && i < nameB.length) {
            if (isNaN(nameA[i]) && isNaN(nameB[i])) {
              const comparison = nameA[i].localeCompare(nameB[i]);
              if (comparison !== 0) {
                return comparison;
              }
            } else if (!isNaN(nameA[i]) && !isNaN(nameB[i])) {
              const numA = parseInt(nameA[i]);
              const numB = parseInt(nameB[i]);
              if (numA !== numB) {
                return numA - numB;
              }
            } else {
              return isNaN(nameA[i]) ? 1 : -1;
            }
            i++;
          }
          return nameA.length - nameB.length;
        });
        this.selectedExpenseSortOption = 'Name (A-Z)';
        break;
    }
    this.showExpenseSortDropdown = false;
    this.generateCombinedChart();
  }

  clearIncomeSorting() {
    this.selectedIncomeSortOption = 'Sort By';
    this.filteredIncomes = [...this.originalIncomes];
    this.showIncomeSortDropdown = false;
    this.generateCombinedChart();
  }

  clearExpenseSorting() {
    this.selectedExpenseSortOption = 'Sort By';
    this.filteredExpenses = [...this.originalExpenses];
    this.showExpenseSortDropdown = false;
    this.generateCombinedChart();
  }

  generateCombinedChart() {
    if (this.expenseData && this.incomeData && this.combinedChartRef) {
      const ctx = this.combinedChartRef.nativeElement.getContext('2d');
      // Create objects to store the total amounts for each month
      const expenseMonthlyTotals: { [month: string]: number } = {};
      const incomeMonthlyTotals: { [month: string]: number } = {};

      // Calculate the total expense amount for each month
      for (const item of this.expenseData) {
        const date = new Date(item.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (expenseMonthlyTotals[month]) {
          expenseMonthlyTotals[month] += item.amount;
        } else {
          expenseMonthlyTotals[month] = item.amount;
        }
      }

      // Calculate the total income amount for each month
      for (const item of this.incomeData) {
        const date = new Date(item.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (incomeMonthlyTotals[month]) {
          incomeMonthlyTotals[month] += item.amount;
        } else {
          incomeMonthlyTotals[month] = item.amount;
        }
      }

      // Extract the months and total amounts for expense and income
      const months: string[] = Array.from(new Set([...Object.keys(expenseMonthlyTotals), ...Object.keys(incomeMonthlyTotals)]));
      const expenseData: { x: string; y: number }[] = months
        .map(month => ({
          x: month,
          y: expenseMonthlyTotals[month] || 0,
        }))
        .filter(data => data.y !== 0);
      const incomeData: { x: string; y: number }[] = months
        .map(month => ({
          x: month,
          y: incomeMonthlyTotals[month] || 0,
        }))
        .filter(data => data.y !== 0);

      // Calculate the most profitable month
      let maxProfit = -Infinity;
      let mostProfitableMonth = '';
      let mostProfitAmount = 0;

      for (const month of months) {
        const income = incomeMonthlyTotals[month] || 0;
        const expense = expenseMonthlyTotals[month] || 0;
        const profit = income - expense;

        if (profit > maxProfit) {
          maxProfit = profit;
          mostProfitableMonth = month;
          mostProfitAmount = profit;
        }
      }
      this.mostProfitableMonth = mostProfitableMonth;
      this.mostProfitAmount = Number(this.decimalPipe.transform(mostProfitAmount, '1.2-2'));

      // Calculate the least profitable month
      let minProfit = Infinity;
      let leastProfitableMonth = '';
      let leastProfitAmount = 0;

      for (const month of months) {
        const income = incomeMonthlyTotals[month] || 0;
        const expense = expenseMonthlyTotals[month] || 0;
        const profit = income - expense;

        if (profit < minProfit) {
          minProfit = profit;
          leastProfitableMonth = month;
          leastProfitAmount = profit;
        }
      }

      this.leastProfitableMonth = leastProfitableMonth;
      this.leastProfitAmount = Number(this.decimalPipe.transform(leastProfitAmount, '1.2-2'));

      // Calculate the total profit
      this.totalProfit =
        Object.values(incomeMonthlyTotals).reduce((sum, income) => sum + income, 0) -
        Object.values(expenseMonthlyTotals).reduce((sum, expense) => sum + expense, 0);

      // Destroy the previous chart instance if it exists
      if (this.combinedChart) {
        this.combinedChart.destroy();
      }

      // Create a new chart instance
      this.combinedChart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Expense',
              data: expenseData as { x: string; y: number }[],
              borderColor: 'red',
              fill: false,
            },
            {
              label: 'Income',
              data: incomeData as { x: string; y: number }[],
              borderColor: 'blue',
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Months',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Amount',
              },
            },
          },
        },
      });
    }
  }
  scrollToGraph() {
    const graphElement = document.getElementById('financeReport');
    if (graphElement) {
      graphElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToStatistics() {
    const containerElement = document.querySelector('.statistics');
    if (containerElement) {
      containerElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showRegenerateConfirmation() {
    const confirmation = confirm('Are you sure you want to regenerate the data? This will clear the imported files and the graph.');
    if (confirmation) {
      this.regenerateData();
    }
  }
  regenerateData() {
    {
      // Clearing file references and data
      this.expenseFile = null;
      this.incomeFile = null;
      this.expenseData = null;
      this.incomeData = null;
      this.filteredIncomes = []; // Clear filteredIncomes array
      this.filteredExpenses = []; // Clear filteredExpenses array
      this.originalIncomes = []; // Clear originalIncomes array
      this.originalExpenses = []; // Clear originalExpenses array

      // Resetting file input visuals
      if (this.expenseInput) {
        this.expenseInput.nativeElement.value = '';
        this.expenseInput.nativeElement.parentElement?.classList.remove('file-uploaded');
      }
      if (this.incomeInput) {
        this.incomeInput.nativeElement.value = '';
        this.incomeInput.nativeElement.parentElement?.classList.remove('file-uploaded');
      }

      // Destroying the existing chart instance if it exists
      if (this.combinedChart) {
        this.combinedChart.destroy();
        this.combinedChart = null;
      }

      // Resetting the report details
      this.mostProfitableMonth = '';
      this.leastProfitableMonth = '';
      this.mostProfitAmount = 0;
      this.leastProfitAmount = 0;
      this.totalProfit = 0;
      this.totalExpense = 0; // Reset totalExpense
      this.totalIncome = 0; // Reset totalIncome

      // Resetting the sort options
      this.selectedIncomeSortOption = 'Sort By';
      this.selectedExpenseSortOption = 'Sort By';
      this.showIncomeSortDropdown = false;
      this.showExpenseSortDropdown = false;
    }
  }
  async saveReport(format: string): Promise<void> {
    if (!this.incomeData || !this.expenseData) {
      alert('Please import both income and expense files before saving the report.');
      return;
    }
    if (format === 'pdf') {
      const fileName = prompt('Enter file name');
      if (fileName) {
        const pdf = new jsPDF('portrait', 'mm', 'a4');

        // Add Finance Report title and Line Chart on the first page
        pdf.setFontSize(18);
        pdf.text('Finance Report', 10, 10);

        const lineChartCanvas = document.querySelector('.lineChartContainer canvas') as HTMLCanvasElement | null;
        if (lineChartCanvas) {
          const lineChartData = lineChartCanvas.toDataURL('image/png');
          const lineChartWidth = pdf.internal.pageSize.getWidth() - 20;
          const lineChartHeight = (lineChartCanvas.height * lineChartWidth) / lineChartCanvas.width;
          pdf.addImage(lineChartData, 'PNG', 10, 30, lineChartWidth, lineChartHeight);
        }

        // Add Expenses
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Expenses', 10, 10);
        let y = 20;
        this.expenses.forEach(expense => {
          pdf.text(`${expense.name}: £${expense.amount.toFixed(2)}`, 10, y);
          y += 10;
        });

        // Add Incomes
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Incomes', 10, 10);
        y = 20;
        this.incomes.forEach(income => {
          pdf.text(`${income.name}: £${income.amount.toFixed(2)}`, 10, y);
          y += 10;
        });

        // Add Monthly Summary
        const monthlyIncome: { [key: string]: number } = {};
        const monthlyExpense: { [key: string]: number } = {};
        this.incomes.forEach(income => {
          const month = new Date(income.date).toLocaleString('default', { month: 'long' });
          monthlyIncome[month] = (monthlyIncome[month] || 0) + income.amount;
        });
        this.expenses.forEach(expense => {
          const month = new Date(expense.date).toLocaleString('default', { month: 'long' });
          monthlyExpense[month] = (monthlyExpense[month] || 0) + expense.amount;
        });

        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Monthly Summary', 10, 10);
        y = 20;
        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];
        months.forEach(month => {
          const incomeAmount = monthlyIncome[month] || 0;
          const expenseAmount = monthlyExpense[month] || 0;
          const profit = incomeAmount - expenseAmount;
          pdf.text(
            `${month} Income: £${incomeAmount.toFixed(2)} | Expenses: £${expenseAmount.toFixed(2)} | Total Profit: £${profit.toFixed(2)}`,
            10,
            y
          );
          y += 10;
        });

        // Add Results
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Results', 10, 10);
        y = 20;
        const totalIncome = this.incomes.reduce((total, income) => total + income.amount, 0);
        const totalExpenses = this.expenses.reduce((total, expense) => total + expense.amount, 0);
        const totalProfit = totalIncome - totalExpenses;

        const monthlyProfits: { [key: string]: number } = {};
        months.forEach(month => {
          const incomeAmount = monthlyIncome[month] || 0;
          const expenseAmount = monthlyExpense[month] || 0;
          monthlyProfits[month] = incomeAmount - expenseAmount;
        });

        const mostProfitableMonth = Object.keys(monthlyProfits).reduce((a, b) => (monthlyProfits[a] > monthlyProfits[b] ? a : b));
        const leastProfitableMonth = Object.keys(monthlyProfits).reduce((a, b) => (monthlyProfits[a] < monthlyProfits[b] ? a : b));

        pdf.text(`Total Income: £${totalIncome.toFixed(2)}`, 10, y);
        y += 10;
        pdf.text(`Total Expenses: £${totalExpenses.toFixed(2)}`, 10, y);
        y += 10;
        pdf.text(`Most Profitable Month: ${mostProfitableMonth} (£${monthlyProfits[mostProfitableMonth].toFixed(2)})`, 10, y);
        y += 10;
        pdf.text(`Least Profitable Month: ${leastProfitableMonth} (£${monthlyProfits[leastProfitableMonth].toFixed(2)})`, 10, y);
        y += 10;
        pdf.text(`Total Profit: £${totalProfit.toFixed(2)}`, 10, y);

        pdf.save(`${fileName}.pdf`);
      }
    }
  }
}
