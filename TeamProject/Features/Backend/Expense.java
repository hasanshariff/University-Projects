package team.bham.entities;

import java.util.Date;
import javax.persistence.*;
import lombok.*;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "Expense")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EXPENSE_ID")
    private Integer expense_ID;

    @Column(name = "NAME")
    private String name;

    @Column(name = "AMOUNT")
    private Float amount;

    @Column(name = "DATE")
    private Date date;
}
