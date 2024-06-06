import { Component } from '@angular/core';
import { ChartOptions, ChartType, ChartDataset, Chart } from 'chart.js';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface Income {
  income_ID?: number;
  name: string;
  amount: number;
  date: string;
}

@Component({
  selector: 'jhi-income-tracker',
  templateUrl: './income-tracker.component.html',
  styleUrls: ['./income-tracker.component.scss'],
})
export class IncomeTrackerComponent {
  income: Income[] = [];
  filteredIncome: Income[] = [];
  totalIncome = 0;
  searchText = '';
  isDarkMode = false;
  barChartVisible: boolean = true;
  pieChartVisible: boolean = true;
  selectedSortOption = 'Sort By';
  showSortDropdown = false;
  fileImported = false;
  originalIncome: Income[] = [];
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
  public barChartData: any[] = [{ data: [], label: 'Income Amount' }];

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
  public pieChartData: any[] = [{ data: [], label: 'Income Amount' }];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;

  constructor(private http: HttpClient) {}

  getIncomes(): Observable<Income[]> {
    return this.http.get<Income[]>('/api/incomes');
  }

  createIncome(income: Income): Observable<Income> {
    return this.http.post<Income>('/api/financial-management/incomes', income);
  }

  createIncomes(incomes: Income[]): Observable<Income[]> {
    return this.http.post<Income[]>('/api/financial-management/incomes/bulk', incomes);
  }

  updateIncome(income: Income): Observable<Income> {
    return this.http.put<Income>(`/api/financial-management/incomes/${income}`, income);
  }

  deleteIncome(incomeId: number): Observable<void> {
    return this.http.delete<void>(`/api/financial-management/incomes/${incomeId}`);
  }

  updateBarChart(): void {
    this.barChartLabels = this.income.map((income: { name: string }) => income.name);
    this.barChartData[0].data = this.income.map((income: { amount: number }) => income.amount);
  }

  updatePieChart(): void {
    const monthlyIncome: { [key: string]: number } = {};
    this.income.forEach(income => {
      const month = new Date(income.date).toLocaleString('default', { month: 'long' });
      monthlyIncome[month] = (monthlyIncome[month] || 0) + income.amount;
    });
    this.pieChartLabels = Object.keys(monthlyIncome);
    this.pieChartData = [
      {
        data: Object.values(monthlyIncome),
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

  clearData(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.income = [];
      this.filteredIncome = [];
      this.totalIncome = 0;
      this.fileImported = false; // Reset fileImported property
      this.updateTable();
      this.updateBarChart();
      this.updatePieChart();
    }
  }

  scrollToGraph() {
    const graphElement = document.getElementById('incomeTracker');
    if (graphElement) {
      graphElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  addIncome(event: Event, incomeName: string, incomeAmount: string, incomeDate: string): void {
    event.preventDefault();

    if (!incomeName || !incomeAmount || !incomeDate) {
      alert('Please fill in all three fields.');
      return;
    }

    const amount = parseFloat(incomeAmount);
    if (amount <= 0) {
      alert('Income amount must be a positive number');
      return;
    }

    const newIncome: Income = {
      name: incomeName,
      amount: amount,
      date: new Date(incomeDate).toUTCString(),
    };

    // Make an API call to save the new income to the database using the bulk API
    this.createIncomes([newIncome]).subscribe(
      (createdIncomes: Income[]) => {
        // Assuming the API returns the array with the created incomes,
        // and since we are sending only one, we handle the first element.
        const createdIncome = createdIncomes[0];
        this.income.push(createdIncome);
        this.filteredIncome = this.income;
        this.updateTotalIncome();
        this.updateTable();
        this.updateBarChart();
        this.updatePieChart();
        this.clearInputFields();
        console.log('New income added');
      },
      error => {
        console.error('Error creating income:', error);
        alert('Failed to save income. Please try again.');
      }
    );
  }

  updateTable(): void {
    const tableBody = document.querySelector('tbody');
    if (tableBody) {
      tableBody.innerHTML = '';

      this.filteredIncome.forEach((income, index: number) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
        <td>${income.name}</td>
        <td>£${income.amount.toFixed(2)}</td>
        <td>${income.date}</td>
        <td><button type="button" class="remove-button">&times;</button></td>
      `;

        const removeButton = newRow.querySelector('.remove-button');
        if (removeButton) {
          removeButton.addEventListener('click', event => {
            event.stopPropagation();
            console.log('Delete button clicked for index:', index);
            this.removeIncome(index);
          });
        }

        tableBody.appendChild(newRow);
      });
    }
  }

  clearInputFields(): void {
    (document.getElementById('incomeForm') as HTMLFormElement).reset();
  }

  updateTotalIncome(): void {
    this.totalIncome = this.income.reduce((total, income) => total + income.amount, 0);
  }

  removeIncome(index: number): void {
    const income = this.filteredIncome[index];
    const originalIndex = this.income.findIndex(e => e === income);

    if (originalIndex !== -1) {
      if (income.income_ID !== undefined) {
        // Make an API call to delete the income from the database
        this.deleteIncome(income.income_ID).subscribe({
          next: () => {
            // Remove the income from the arrays after successful deletion
            this.income.splice(originalIndex, 1);
            this.filteredIncome.splice(index, 1);
            this.updateTotalIncome();
            this.updateTable();
            this.updateBarChart();
            this.updatePieChart();
          },
          error: error => {
            console.error('Error deleting income:', error);
            alert('An error occurred while deleting the income.');
          },
          complete: () => {
            console.log('Delete operation completed.');
          },
        });
      } else {
        console.error('Income ID is undefined. Unable to delete income from the database.');
        alert('The income does not have a valid ID. It cannot be deleted from the database.');
      }
    }
  }

  async saveReport(format: string): Promise<void> {
    if (this.income.length === 0) {
      alert('Please import or add incomes before saving the report.');
      return;
    }

    if (format === 'json') {
      this.showSaveModal = true;
    } else if (format === 'pdf') {
      const fileName = prompt('Enter file name');
      if (fileName) {
        const pdf = new jsPDF('portrait', 'mm', 'a4');

        // Page 1: Income List
        pdf.text('Income List', 10, 10);

        // Add table headers
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        pdf.text('Name', 10, 20);
        pdf.text('Amount', 60, 20);
        pdf.text('Date', 110, 20);

        // Add table rows
        let y = 30;
        this.income.forEach(income => {
          pdf.text(income.name.toString(), 10, y);
          pdf.text(`£${income.amount.toFixed(2)}`, 60, y);

          // Parse the formatted date string and convert it to a localized date string
          const parsedDate = new Date(income.date);
          pdf.text(parsedDate.toLocaleDateString(), 110, y);

          y += 10;
        });

        // Page 2: Statistics
        pdf.addPage();
        pdf.text('Income Statistics', 10, 10);

        // Add monthly statements
        const monthlyIncome: { [key: string]: number } = {};
        this.income.forEach(income => {
          const parsedDate = new Date(income.date);
          const month = parsedDate.toLocaleString('default', { month: 'long' });
          monthlyIncome[month] = (monthlyIncome[month] || 0) + income.amount;
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
          if (monthlyIncome[month]) {
            pdf.text(`Total income for ${month}: £${monthlyIncome[month].toFixed(2)}`, 10, y);
            y += 10;
          }
        });

        // Add total income information
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        y += 10;
        pdf.text(`Total Income: £${this.totalIncome.toFixed(2)}`, 10, y);

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
        data = JSON.parse(JSON.stringify(this.income)); // Include the database ID
      } else {
        data = this.income.map(income => ({
          name: income.name,
          amount: income.amount,
          date: income.date,
        })); // Exclude the database ID
      }
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      saveAs(blob, `${fileName}.json`);
    }
    this.showSaveModal = false; // Hide the modal after saving the file or when no file name is entered
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const importedIncomes: Income[] = JSON.parse(e.target.result);

        // Convert date strings to Date objects for each imported income
        const incomesToCreate: Income[] = importedIncomes.map((income: any) => ({
          ...income,
          date: new Date(income.date),
        }));

        // Save the imported incomes to the database using the bulk API
        this.createIncomes(incomesToCreate)
          .pipe(
            tap((createdIncomes: Income[]) => {
              console.log('Imported incomes saved to the database:', createdIncomes);

              // Update the income_ID property of each imported income with the assigned ID from the database
              createdIncomes.forEach((createdIncome, index) => {
                incomesToCreate[index].income_ID = createdIncome.income_ID;
              });

              // Update the UI with the imported incomes
              this.income = [...this.income, ...incomesToCreate];
              this.filteredIncome = [...this.income];
              this.originalIncome = [...this.income];
              this.updateTotalIncome();
              this.updateTable();
              this.updateBarChart();
              this.updatePieChart();
              this.fileImported = true;
            }),
            catchError(error => {
              console.error('Error saving imported incomes to the database:', error);
              alert('An error occurred while saving the imported incomes to the database.');
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
      this.income = [];
      this.filteredIncome = [];
      this.originalIncome = [];
      this.totalIncome = 0;
      this.fileImported = false; // Set fileImported to false
      this.updateTable();
      this.updateBarChart();
      this.updatePieChart();
    }
  }
  openFileInput() {
    document.getElementById('fileInput')?.click();
  }

  // ...
  toggleSortDropdown() {
    this.showSortDropdown = !this.showSortDropdown;
  }

  sortIncome(option: string) {
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
        this.filteredIncome.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthA] - monthOrder[monthB];
        });
        this.selectedSortOption = 'Newest - Oldest';
        break;
      case 'oldest':
        this.filteredIncome.sort((a, b) => {
          const monthA = new Date(a.date).toLocaleString('default', { month: 'long' });
          const monthB = new Date(b.date).toLocaleString('default', { month: 'long' });
          return monthOrder[monthB] - monthOrder[monthA];
        });
        this.selectedSortOption = 'Oldest - Newest';
        break;
      case 'amount-desc':
        this.filteredIncome.sort((a, b) => b.amount - a.amount);
        this.selectedSortOption = 'Amount (Desc)';
        break;
      case 'amount-asc':
        this.filteredIncome.sort((a, b) => a.amount - b.amount);
        this.selectedSortOption = 'Amount (Asc)';
        break;
      case 'name':
        this.filteredIncome.sort((a, b) => a.name.localeCompare(b.name));
        this.selectedSortOption = 'Name (A-Z)';
        break;
    }
    this.showSortDropdown = false;
    this.updateTable();
  }

  clearSorting() {
    this.selectedSortOption = 'Sort By';
    this.filteredIncome = [...this.originalIncome];
    this.showSortDropdown = false;
    this.updateTable();
  }
  // ...

  toggleBarChartVisibility(): void {
    this.barChartVisible = !this.barChartVisible;
  }

  togglePieChartVisibility(): void {
    this.pieChartVisible = !this.pieChartVisible;
  }

  searchIncome(): void {
    if (!this.searchText) {
      this.filteredIncome = this.income;
    } else {
      const searchQuery = this.searchText.toLowerCase();
      this.filteredIncome = this.income.filter(
        income => income.name.toLowerCase().includes(searchQuery) || income.amount.toString().toLowerCase().includes(searchQuery)
      );

      if (this.filteredIncome.length === 0) {
        alert('Item not found');
      }
    }
    this.updateTable();
  }

  clearSearch(): void {
    this.searchText = '';
    this.filteredIncome = this.income;
    this.updateTable();
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const incomeTrackerElement = document.querySelector('.income-tracker');
    if (incomeTrackerElement) {
      incomeTrackerElement.classList.toggle('dark-mode');
    }
  }
  toggleTextSize() {
    console.log('toggleTextSize called');
    this.isLargeText = !this.isLargeText;
    console.log('isLargeText:', this.isLargeText);
  }
}
