package team.bham.features.financialManagement;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import team.bham.entities.Expense;
import team.bham.entities.Income;
import team.bham.repository.IncomeRepository;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;

    @Autowired
    public IncomeService(IncomeRepository incomeRepository) {
        this.incomeRepository = incomeRepository;
    }

    public List<Income> getAllIncomes() {
        return incomeRepository.findAll();
    }

    public Income getIncomeById(Integer id) {
        return incomeRepository.findById(id).orElse(null);
    }

    public Income createIncome(Income income) {
        return incomeRepository.save(income);
    }

    public Income updateIncome(Integer id, Income income) {
        Income existingIncome = incomeRepository.findById(id).orElse(null);
        if (existingIncome != null) {
            existingIncome.setName(income.getName());
            existingIncome.setAmount(income.getAmount());
            existingIncome.setDate(income.getDate());
            return incomeRepository.save(existingIncome);
        }
        return null;
    }

    public boolean deleteIncome(Integer incomeId) {
        if (incomeRepository.existsById(incomeId)) {
            incomeRepository.deleteById(incomeId);
            return true;
        }
        return false;
    }

    public List<Income> createIncomes(List<Income> incomes) {
        return incomeRepository.saveAll(incomes);
    }
}
