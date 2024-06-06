package team.bham.features.financialManagement;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.bham.entities.Expense;
import team.bham.entities.Income;

@RestController
@RequestMapping("/api/financial-management")
public class FinancialManagementController {

    private final ExpenseService expenseService;
    private final IncomeService incomeService;

    @Autowired
    public FinancialManagementController(ExpenseService expenseService, IncomeService incomeService) {
        this.expenseService = expenseService;
        this.incomeService = incomeService;
    }

    // Expense endpoints
    @GetMapping("/expenses")
    public List<Expense> getAllExpenses() {
        return expenseService.getAllExpenses();
    }

    @GetMapping("/expenses/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Integer id) {
        Expense expense = expenseService.getExpenseById(id);
        if (expense != null) {
            return ResponseEntity.ok(expense);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/expenses")
    public ResponseEntity<Expense> createExpense(@RequestBody Expense expense) {
        Expense createdExpense = expenseService.createExpense(expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExpense);
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable Integer id, @RequestBody Expense expense) {
        Expense updatedExpense = expenseService.updateExpense(id, expense);
        if (updatedExpense != null) {
            return ResponseEntity.ok(updatedExpense);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/expenses/{index}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Integer index) {
        boolean deleted = expenseService.deleteExpense(index);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/expenses/bulk")
    public ResponseEntity<List<Expense>> createExpenses(@RequestBody List<Expense> expenses) {
        List<Expense> createdExpenses = expenseService.createExpenses(expenses);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExpenses);
    }

    // Income endpoints
    @GetMapping("/incomes")
    public List<Income> getAllIncomes() {
        return incomeService.getAllIncomes();
    }

    @GetMapping("/incomes/{id}")
    public ResponseEntity<Income> getIncomeById(@PathVariable Integer id) {
        Income income = incomeService.getIncomeById(id);
        if (income != null) {
            return ResponseEntity.ok(income);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/incomes")
    public ResponseEntity<Object> createIncome(@RequestBody Object incomeData) {
        if (incomeData instanceof List) {
            // If incomeData is a list, treat it as bulk creation
            @SuppressWarnings("unchecked")
            List<Income> incomes = (List<Income>) incomeData;
            List<Income> createdIncomes = incomeService.createIncomes(incomes);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdIncomes);
        } else if (incomeData instanceof Income) {
            // If incomeData is a single object, treat it as single creation
            Income income = (Income) incomeData;
            Income createdIncome = incomeService.createIncome(income);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdIncome);
        } else {
            // Handle invalid request
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/incomes/bulk")
    public ResponseEntity<List<Income>> createIncomes(@RequestBody List<Income> incomes) {
        List<Income> createdIncomes = incomeService.createIncomes(incomes);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdIncomes);
    }

    @PutMapping("/incomes/{id}")
    public ResponseEntity<Income> updateIncome(@PathVariable Integer id, @RequestBody Income income) {
        Income updatedIncome = incomeService.updateIncome(id, income);
        if (updatedIncome != null) {
            return ResponseEntity.ok(updatedIncome);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/incomes/{incomeId}")
    public ResponseEntity<Void> deleteIncome(@PathVariable Integer incomeId) {
        boolean deleted = incomeService.deleteIncome(incomeId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
