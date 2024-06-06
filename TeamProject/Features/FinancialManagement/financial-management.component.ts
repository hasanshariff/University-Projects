import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'jhi-financial-management',
  templateUrl: './financial-management.component.html',
  styleUrls: ['./financial-management.component.scss'],
})
export class FinancialManagementComponent {
  isDarkMode = false;
  isLargeText = false;

  constructor(private router: Router) {}

  get showParentUI(): boolean {
    return (
      !this.router.isActive('/features/financial-management/expense-tracker', {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      }) &&
      !this.router.isActive('/features/financial-management/income-tracker', {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      }) &&
      !this.router.isActive('/features/financial-management/finance-report', {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      }) &&
      !this.router.isActive('/features/financial-management/budget-tools', {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      })
    );
  }
}
