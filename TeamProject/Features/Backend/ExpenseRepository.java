package team.bham.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import team.bham.entities.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Integer> {
    List<Expense> findAll();

    Optional<Expense> findById(Integer id);

    Expense save(Expense expense);

    boolean existsById(Integer id);

    void deleteById(Integer id);
}
