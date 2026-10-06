package services;

import models.Booking;
import models.Land;
import models.Payment;
import models.User;
import com.landhub.exception.ApiException;
import data.*;
import com.landhub.util.MoneyUtil;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final PaymentRepository paymentRepo;
    private final BookingRepository bookingRepo;
    private final LandRepository landRepo;
    private final UserRepository userRepo;

    public byte[] generateInvoice(Long paymentId, Long userId) throws IOException {
        Payment payment = paymentRepo.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("Payment not found"));
        Booking booking = bookingRepo.findById(payment.getBookingId()).orElse(null);
        User payer = userRepo.findById(payment.getPayerId()).orElse(null);
        Land land = booking != null ? landRepo.findById(booking.getLandId()).orElse(null) : null;

        // Verify ownership
        if (!payment.getPayerId().equals(userId)) {
            if (booking == null || !booking.getSellerId().equals(userId)) {
                throw ApiException.forbidden("You can only view your own invoices");
            }
        }

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // Header bar
                cs.setNonStrokingColor(0.08f, 0.13f, 0.30f);
                cs.addRect(0, h - 80, w, 80);
                cs.fill();

                cs.beginText();
                cs.setFont(fontBold, 22);
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.newLineAtOffset(40, h - 52);
                cs.showText("LandHub Sri Lanka");
                cs.endText();

                cs.beginText();
                cs.setFont(font, 10);
                cs.newLineAtOffset(40, h - 70);
                cs.showText("Web-Based Land Sales & Property Management System");
                cs.endText();

                // Title
                float y = h - 120;
                cs.beginText();
                cs.setFont(fontBold, 16);
                cs.setNonStrokingColor(0.08f, 0.13f, 0.30f);
                cs.newLineAtOffset(40, y);
                cs.showText("PAYMENT INVOICE");
                cs.endText();

                // Invoice details
                y -= 30;
                drawRow(cs, font, fontBold, 40, y, "Invoice No:", payment.getInvoiceNo()); y -= 20;
                drawRow(cs, font, fontBold, 40, y, "Reference:", payment.getReference()); y -= 20;
                drawRow(cs, font, fontBold, 40, y, "Date:", payment.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))); y -= 20;
                drawRow(cs, font, fontBold, 40, y, "Status:", payment.getStatus().name()); y -= 20;
                drawRow(cs, font, fontBold, 40, y, "Method:", payment.getMethod().name()); y -= 30;

                // Payer info
                cs.beginText(); cs.setFont(fontBold, 12); cs.setNonStrokingColor(0.08f, 0.13f, 0.30f);
                cs.newLineAtOffset(40, y); cs.showText("Payer Details"); cs.endText(); y -= 20;
                if (payer != null) {
                    drawRow(cs, font, fontBold, 40, y, "Name:", payer.getFullName()); y -= 20;
                    drawRow(cs, font, fontBold, 40, y, "Email:", payer.getEmail()); y -= 20;
                    if (payer.getPhone() != null) { drawRow(cs, font, fontBold, 40, y, "Phone:", payer.getPhone()); y -= 20; }
                }
                y -= 10;

                // Property info
                if (land != null) {
                    cs.beginText(); cs.setFont(fontBold, 12); cs.setNonStrokingColor(0.08f, 0.13f, 0.30f);
                    cs.newLineAtOffset(40, y); cs.showText("Property"); cs.endText(); y -= 20;
                    drawRow(cs, font, fontBold, 40, y, "Title:", land.getTitle()); y -= 20;
                    drawRow(cs, font, fontBold, 40, y, "Location:", land.getCity() + ", " + land.getDistrict()); y -= 20;
                    drawRow(cs, font, fontBold, 40, y, "Size:", land.getPerches() + " Perches"); y -= 30;
                }

                // Amount
                cs.setNonStrokingColor(0.93f, 0.79f, 0.24f);
                cs.addRect(40, y - 5, w - 80, 35);
                cs.fill();

                cs.beginText(); cs.setFont(fontBold, 14); cs.setNonStrokingColor(0.08f, 0.13f, 0.30f);
                cs.newLineAtOffset(50, y + 8);
                cs.showText("Amount Paid: " + MoneyUtil.lkr(payment.getAmount()));
                cs.endText(); y -= 50;

                // Footer
                cs.beginText(); cs.setFont(font, 8); cs.setNonStrokingColor(0.5f, 0.5f, 0.5f);
                cs.newLineAtOffset(40, 40);
                cs.showText("This is a computer-generated demo invoice. LandHub Sri Lanka - sandbox payment receipt.");
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private void drawRow(PDPageContentStream cs, PDType1Font font, PDType1Font fontBold,
                          float x, float y, String label, String value) throws IOException {
        cs.beginText(); cs.setFont(fontBold, 10); cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
        cs.newLineAtOffset(x, y); cs.showText(label); cs.endText();
        cs.beginText(); cs.setFont(font, 10); cs.setNonStrokingColor(0.1f, 0.1f, 0.1f);
        cs.newLineAtOffset(x + 90, y); cs.showText(value != null ? value : ""); cs.endText();
    }
}

