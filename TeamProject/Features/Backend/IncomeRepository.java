package team.bham.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import team.bham.entities.Income;

public interface IncomeRepository extends JpaRepository<Income, Integer> {
    List<Income> findAll();

    Optional<Income> findById(Integer id);

    Income save(Income income);

    boolean existsById(Integer id);

    void deleteById(Integer id);
}
