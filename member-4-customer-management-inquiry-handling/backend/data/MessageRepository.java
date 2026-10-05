package data;

import models.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationOrderByIdAsc(String conversation);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation = :conversation AND m.receiverId = :receiverId")
    void markReadInConversation(String conversation, Long receiverId);

    @Query("SELECT m.conversation, MAX(m.createdAt), " +
           "(SELECT x.body FROM Message x WHERE x.conversation = m.conversation ORDER BY x.id DESC LIMIT 1), " +
           "(SELECT x.landId FROM Message x WHERE x.conversation = m.conversation ORDER BY x.id DESC LIMIT 1), " +
           "SUM(CASE WHEN m.receiverId = :userId AND m.isRead = false THEN 1 ELSE 0 END) " +
           "FROM Message m WHERE m.senderId = :userId OR m.receiverId = :userId " +
           "GROUP BY m.conversation ORDER BY MAX(m.createdAt) DESC")
    List<Object[]> findConversationsForUser(Long userId);

    long countByReceiverIdAndIsReadFalse(Long receiverId);
}

