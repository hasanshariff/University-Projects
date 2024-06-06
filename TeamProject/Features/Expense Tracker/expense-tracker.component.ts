import { Component } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset, Chart } from 'chart.js';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface Expense {
  expense_ID?: number;
  name: string;
  amount: number;
  date: string;
}

@Component({
  selector: 'jhi-expense-tracker',
  templateUrl: './expense-tracker.component.html',
  styleUrls: ['./expense-tracker.component.scss'],
})
export class ExpenseTrackerComponent {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  totalExpenses = 0;
  searchText = '';
  isDarkMode = false;
  budget = 0;
  remainingBudget = 0;
  showBudgetModal = false;
  budgetAmount = 0;
  fileImported = false;
  showSortDropdown = false;
  selectedSortOption = 'Sort By';
  originalExpenses: Expense[] = [];
  showSaveModal = false;
  isLargeText = false;
  private apiUrl = '/api/financial-management';

  public barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  public barChartLabels: string[] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartData: any[] = [{ data: [], label: 'Expense Amount' }];

  public pieChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  public pieChartLabels: string[] = [];
  public pieChartData: any[] = [{ data: [], label: 'Expense Amount' }];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;

  constructor(private http: HttpClient) {}

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>('/api/expenses');
  }

  createExpenses(expenses: Expense[]): Observable<Expense[]> {
    return this.http.post<Expense[]>('/api/financial-management/expenses/bulk', expenses);
  }

  updateExpense(expense: Expense, id: string): Observable<Expense> {
    return this.http.put<Expense>(`/api/expenses/${id}`, expense);
  }

  deleteExpense(expenseId: number): Observable<void> {
    return this.http.delete<void>(`/api/financial-management/expenses/${expenseId}`);
  }
  updateBarChart(): void {
    this.barChartLabels = this.expenses.map((expense: { name: string }) => expense.name);
    this.barChartData[0].data = this.expenses.map((expense: { amount: number }) => expense.amount);
  }

  updatePieChart(): void {
    const monthlyExpenses: { [key: string]: number } = {};
    this.expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'long' });
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + expense.amount;
    });
    this.pieChartLabels = Object.keys(monthlyExpenses);
    this.pieChartData = [
      {
        data: Object.values(monthlyExpenses),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#E83E10',
          '#1D10E8',
          '#E810BA',
          '#6E1B1B',
          '#13802C',
          '#F00808',
        ],
      },
    ];
  }

  openBudgetModal(): void {
    this.showBudgetModal = true;
  }

  closeBudgetModal(): void {
    this.showBudgetModal = false;
  }

  setBudget(): void {
    this.budget = this.budgetAmount;
    this.remainingBudget = this.budget - this.totalExpenses;
    this.showBudgetModal = false;
  }

  clearBudget(): void {
    this.budget = 0;
    this.remainingBudget = 0;
    this.budgetAmount = 0;
  }

  clearData(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.expenses = [];
      this.filteredExpenses = [];
      this.totalExpenses = 0;
      this.budget = 0;
      this.remainingBudget = 0;
      this.fileImported = false; // Reset fileImported property
      this.updateTable();
      this.updateBarChart();
      this.updatePieChart();
    }
  }

  scrollToGraph() {
    const graphElement = document.getElementById('expenseTracker');
    if (graphElement) {
      graphElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
  addExpense(event: Event, expenseName: string, expenseAmount: string, expenseDate: string): void {
    event.preventDefault();

    if (!expenseName || !expenseAmount || !expenseDate) {
      alert('Please fill in all three fields.');
      return;
    }
    const amount = parseFloat(expenseAmount);
    if (amount <= 0) {
      alert('Expense amount must be a positive number');
      return;
    }

    const newExpense: Expense = {
      name: expenseName,
      amount: amount,
      date: new Date(expenseDate).toUTCString(),
    };

    // Make an API call to save the new expense to the database using the bulk API
    this.createExpenses([newExpense]).subscribe(
      (createdExpenses: Expense[]) => {
        // Assuming the API returns the array with the created expenses,
        // and since we are sending only one, we handle the first element.
        const createdExpense = createdExpenses[0];
        this.expenses.push(createdExpense);
        this.filteredExpenses = this.expenses;
        this.updateTotalExpenses();
        this.updateTable();
        this.updateBarChart();
        this.updatePieChart();
        this.clearInputFields();
        this.remainingBudget -= createdExpense.amount;
        console.log('New expense Added');
      },
      error => {
        console.error('Error creating expense:', error);
        alert('Failed to save expense. Please try again.');
      }
    );
  }

  updateTable(): void {
    const tableBody = document.querySelector('tbody');
    if (tableBody) {
      tableBody.innerHTML = '';

      this.filteredExpenses.forEach((expense: Expense, index: number) => {
        const newRow = document.createElement('tr');

        // Parse the date string and format it as desired
        const parsedDate = new Date(expense.date);
        const formattedDate = parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        newRow.innerHTML = `
        <td>${expense.name}</td>
        <td>£${expense.amount.toFixed(2)}</td>
        <td>${formattedDate}</td>
        <td><button type="button" class="remove-button">&times;</button></td>
      `;

        const removeButton = newRow.querySelector('.remove-button');
        if (removeButton) {
          removeButton.addEventListener('click', () => {
            this.removeExpense(index);
          });
        }

        tableBody.appendChild(newRow);
      });
    }
  }

  clearInputFields(): void {
    (document.getElementById('expenseForm') as HTMLFormElement).reset();
  }

  updateTotalExpenses(): void {
    this.totalExpenses = this.expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  removeExpense(index: number): void {
    const expense = this.filteredExpenses[index];
    const originalIndex = this.expenses.findIndex(e => e === expense);
    if (originalIndex !== -1) {
      if (expense.expense_ID !== undefined) {
        // Make an API call to delete the expense from the database
        this.deleteExpense(expense.expense_ID).subscribe({
          next: () => {
            // Remove the expense from the arrays after successful deletion
            this.expenses.splice(originalIndex, 1);
            this.filteredExpenses.splice(index, 1);
            this.updateTotalExpenses();
            this.updateRemainingBudget();
            this.updateTable();
            this.updateBarChart();
            this.updatePieChart();
          },
          error: error => {
            console.error('Error deleting expense:', error);
            alert('An error occurred while deleting the expense.');
          },
          complete: () => {
            console.log('Delete operation completed.');
          },
        });
      } else {
        console.error('Expense ID is undefined. Unable to delete expense from the database.');
        alert('The expense does not have a valid ID. It cannot be deleted from the database.');
      }
    }
  }

  updateRemainingBudget(): void {
    this.remainingBudget = this.budget - this.totalExpenses;
  }

  async saveReport(format: string): Promise<void> {
    if (this.expenses.length === 0) {
      alert('Please import or add expenses before saving the report.');
      return;
    }

    if (format === 'json') {
      this.showSaveModal = true; // Show the modal
      // const fileName = prompt('Enter file name');
      // if (fileName) {
      //   const data = JSON.stringify(this.expenses);
      //   const blob = new Blob([data], { type: 'application/json' });
      //   saveAs(blob, `${fileName}.json`);
      // }
    } else if (format === 'pdf') {
      const fileName = prompt('Enter file name');
      if (fileName) {
        const pdf = new jsPDF('portrait', 'mm', 'a4');

        // Page 1: Expense List
        pdf.text('Expense List', 10, 10);

        // Add table headers
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        pdf.text('Name', 10, 20);
        pdf.text('Amount', 60, 20);
        pdf.text('Date', 110, 20);

        // Add table rows
        let y = 30;
        this.expenses.forEach(expense => {
          pdf.text(expense.name.toString(), 10, y);
          pdf.text(`£${expense.amount.toFixed(2)}`, 60, y);

          // Parse the formatted date string and convert it to a localized date string
          const parsedDate = new Date(expense.date);
          pdf.text(parsedDate.toLocaleDateString(), 110, y);

          y += 10;
        });

        // Page 2: Statistics
        pdf.addPage();
        pdf.text('Expense Statistics', 10, 10);

        // Add monthly statements
        const monthlyExpenses: { [key: string]: number } = {};
        this.expenses.forEach(expense => {
          const parsedDate = new Date(expense.date);
          const month = parsedDate.toLocaleString('default', { month: 'long' });
          monthlyExpenses[month] = (monthlyExpenses[month] || 0) + expense.amount;
        });

        pdf.setFontSize(12);
        pdf.setTextColor(0);
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
          if (monthlyExpenses[month]) {
            pdf.text(`Total expenses for ${month}: £${monthlyExpenses[month].toFixed(2)}`, 10, y);
            y += 10;
          }
        });

        // Add total expenses information
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        y += 10;
        pdf.text(`Total Expenses: £${this.totalExpenses.toFixed(2)}`, 10, y);

        // Add budget and remaining budget information
        if (this.budget > 0) {
          pdf.setFontSize(12);
          pdf.setTextColor(0);
          y += 10;
          pdf.text(`Budget Set: £${this.budget.toFixed(2)}`, 10, y);

          y += 10;
          pdf.text(`Remaining Budget: £${this.remainingBudget.toFixed(2)}`, 10, y);
        }

        // Page 3: Bar Chart
        const barChartElement = document.querySelector('.barChartContainer');
        if (barChartElement) {
          const barChartData = await html2canvas(barChartElement as HTMLElement);
          pdf.addPage();
          pdf.text('Bar Chart', 10, 10);
          const barChartWidth = pdf.internal.pageSize.getWidth() - 20;
          const barChartHeight = (barChartData.height * barChartWidth) / barChartData.width;
          pdf.addImage(barChartData.toDataURL(), 'PNG', 10, 10, barChartWidth, barChartHeight);
        }

        // Page 4: Pie Chart
        const pieChartElement = document.querySelector('.pieChartContainer');
        if (pieChartElement) {
          const pieChartData = await html2canvas(pieChartElement as HTMLElement);
          pdf.addPage();
          pdf.text('Pie Chart', 10, 10);
          const pieChartWidth = pdf.internal.pageSize.getWidth() - 20;
          const pieChartHeight = (pieChartData.height * pieChartWidth) / pieChartData.width;
          pdf.addImage(pieChartData.toDataURL(), 'PNG', 10, 10, pieChartWidth, pieChartHeight);
        }

        pdf.save(`${fileName}.pdf`);
      }
    }
  }

  saveJsonFile(includeId: boolean): void {
    const fileName = prompt('Enter file name');
    if (fileName) {
      let data: any[];
      if (includeId) {
        data = JSON.parse(JSON.stringify(this.expenses)); // Include the database ID
      } else {
        data = this.expenses.map(expense => ({
          name: expense.name,
          amount: expense.amount,
          date: expense.date,
        })); // Exclude the database ID
      }
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      saveAs(blob, `${fileName}.json`);
    }
    this.showSaveModal = false; // Hide the modal after saving the file or when no file name is entered
  }

  openFileInput() {
    document.getElementById('fileInput')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const importedExpenses: Expense[] = JSON.parse(e.target.result);

        // Convert date strings to Date objects for each imported expense
        const expensesToCreate: Expense[] = importedExpenses.map((expense: any) => ({
          ...expense,
          date: new Date(expense.date).toUTCString(),
        }));

        // Save the imported expenses to the database using the bulk API
        this.createExpenses(expensesToCreate)
          .pipe(
            tap((createdExpenses: Expense[]) => {
              console.log('Imported expenses saved to the database:', createdExpenses);

              // Update the expense_ID property of each imported expense with the assigned ID from the database
              createdExpenses.forEach((createdExpense, index) => {
                expensesToCreate[index].expense_ID = createdExpense.expense_ID;
              });

              this.expenses = [...this.expenses, ...expensesToCreate];
              this.filteredExpenses = [...this.expenses];
              this.originalExpenses = [...this.expenses];
              this.updateTotalExpenses();
              this.updateRemainingBudget();
              this.updateTable();
              this.updateBarChart();
              this.updatePieChart();
              this.fileImported = true;
            }),
            catchError(error => {
              console.error('Error saving imported expenses to the database:', error);
              alert('An error occurred while saving the imported expenses to the database.');
              return throwError(() => error);
            })
          )
          .subscribe();
      };
      reader.readAsText(file);
    }
  }

  removeImportedFile() {
    if (confirm('Are you sure you want to remove the imported file?')) {
      this.expenses = [];
      this.filteredExpenses = [];
      this.originalExpenses = [];
      this.totalExpenses = 0;
      this.fileImported = false;
      this.updateTable();
      this.updateBarChart();
      this.updatePieChart();
    }
  }

  toggleSortDropdown() {
    this.showSortDropdown = !this.showSortDropdown;
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
        this.selectedSortOption = 'Newest - Oldest';
        break;
      case 'oldest':
        this.filteredExpenses.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthB] - monthOrder[monthA];
        });
        this.selectedSortOption = 'Oldest - Newest';
        break;
      case 'amount-desc':
        this.filteredExpenses.sort((a, b) => b.amount - a.amount);
        this.selectedSortOption = 'Amount (Desc)';
        break;
      case 'amount-asc':
        this.filteredExpenses.sort((a, b) => a.amount - b.amount);
        this.selectedSortOption = 'Amount (Asc)';
        break;
      case 'name':
        this.filteredExpenses.sort((a, b) => {
          const nameA = a.name.match(/\d+|\D+/g) || [];
          const nameB = b.name.match(/\d+|\D+/g) || [];
          let i = 0;
          while (i < nameA.length && i < nameB.length) {
            if (isNaN(Number(nameA[i])) && isNaN(Number(nameB[i]))) {
              const comparison = nameA[i].localeCompare(nameB[i]);
              if (comparison !== 0) {
                return comparison;
              }
            } else if (!isNaN(Number(nameA[i])) && !isNaN(Number(nameB[i]))) {
              const numA = parseInt(nameA[i]);
              const numB = parseInt(nameB[i]);
              if (numA !== numB) {
                return numA - numB;
              }
            } else {
              return isNaN(Number(nameA[i])) ? 1 : -1;
            }
            i++;
          }
          return nameA.length - nameB.length;
        });
        this.selectedSortOption = 'Name (A-Z)';
        break;
        this.showSortDropdown = false;
        this.updateTable();
    }
  }

  clearSorting() {
    this.selectedSortOption = 'Sort By';
    this.filteredExpenses = [...this.originalExpenses]; // Restore the original order of expenses
    this.showSortDropdown = false;
    this.updateTable();
  }

  barChartVisible: boolean = true;
  pieChartVisible: boolean = true;

  toggleBarChartVisibility(): void {
    this.barChartVisible = !this.barChartVisible;
  }

  togglePieChartVisibility(): void {
    this.pieChartVisible = !this.pieChartVisible;
  }

  searchExpenses(): void {
    if (!this.searchText) {
      this.filteredExpenses = this.expenses;
    } else {
      const searchQuery = this.searchText.toLowerCase();
      this.filteredExpenses = this.expenses.filter(
        expense => expense.name.toLowerCase().includes(searchQuery) || expense.amount.toString().toLowerCase().includes(searchQuery)
      );

      if (this.filteredExpenses.length === 0) {
        alert('Item not found');
      }
    }
    this.updateTable();
  }
  clearSearch(): void {
    this.searchText = '';
    this.filteredExpenses = this.expenses;
    this.updateTable();
  }
}
