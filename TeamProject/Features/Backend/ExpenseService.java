package team.bham.features.financialManagement;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.bham.entities.Expense;
import team.bham.repository.ExpenseRepository;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Autowired
    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Expense getExpenseById(Integer id) {
        return expenseRepository.findById(id).orElse(null);
    }

    public Expense createExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public Expense updateExpense(Integer id, Expense expense) {
        Expense existingExpense = expenseRepository.findById(id).orElse(null);
        if (existingExpense != null) {
            existingExpense.setName(expense.getName());
            existingExpense.setAmount(expense.getAmount());
            existingExpense.setDate(expense.getDate());
            return expenseRepository.save(existingExpense);
        }
        return null;
    }

    public boolean deleteExpense(Integer expenseId) {
        if (expenseRepository.existsById(expenseId)) {
            expenseRepository.deleteById(expenseId);
            return true;
        }
        return false;
    }

    public List<Expense> createExpenses(List<Expense> expenses) {
        return expenseRepository.saveAll(expenses);
    }
}
