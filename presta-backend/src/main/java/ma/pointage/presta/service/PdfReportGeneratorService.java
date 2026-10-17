package ma.pointage.presta.service;

import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import ma.pointage.presta.dto.report.ReportDataDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfReportGeneratorService {

    private static final DeviceRgb HEADER_TITLE_COLOR = new DeviceRgb(14, 56, 124); // Dark AXA Blue #0e387c
    private static final DeviceRgb TEXT_DARK = new DeviceRgb(20, 20, 20);
    private static final DeviceRgb TABLE_HEADER_BG = new DeviceRgb(225, 227, 230); // Light gray header #e1e3e6
    private static final DeviceRgb RECAP_LABEL_BG = new DeviceRgb(242, 244, 247); // Light gray recap label #f2f4f7
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(170, 175, 185);   // Crisp gray border

    private static final DateTimeFormatter DATE_FULL_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_SHORT_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    /**
     * Generates a PDF byte array using iText 7.2.5 matching the visual prototype.
     */
    public byte[] generatePdfReport(ReportDataDTO reportData) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);

        document.setMargins(30, 36, 30, 36);

        // 1. Top Header with AXA Logo and Title
        addTopHeader(document);

        // 2. Metadata Info Box
        addMetadataBox(document, reportData);

        // 3. Section 1: Detail des Pointages Table
        addDailyDetailSection(document, reportData);

        // 4. Section 2: Recapitulatif Table
        addRecapSection(document, reportData.getSummaryMetrics());

        document.close();
        return outputStream.toByteArray();
    }

    private void addTopHeader(Document document) {
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{22, 78}))
                .useAllAvailableWidth()
                .setMarginBottom(12);

        // Logo Cell
        Cell logoCell = new Cell().setBorder(null).setVerticalAlignment(VerticalAlignment.MIDDLE);
        Image logo = loadLogoImage();
        if (logo != null) {
            logoCell.add(logo);
        } else {
            logoCell.add(new Paragraph("AXA").setBold().setFontSize(24).setFontColor(HEADER_TITLE_COLOR));
        }

        // Title Cell
        Cell titleCell = new Cell().setBorder(null)
                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                .setPaddingLeft(10);
        Paragraph title = new Paragraph("RAPPORT DE POINTAGE")
                .setFontColor(HEADER_TITLE_COLOR)
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT);
        titleCell.add(title);

        headerTable.addCell(logoCell);
        headerTable.addCell(titleCell);
        document.add(headerTable);
    }

    private void addMetadataBox(Document document, ReportDataDTO reportData) {
        Table boxTable = new Table(UnitValue.createPercentArray(new float[]{100}))
                .useAllAvailableWidth()
                .setMarginBottom(16);

        String periodStr = String.format("%s \u2192 %s",
                reportData.getStartDate().format(DATE_FULL_FORMATTER),
                reportData.getEndDate().format(DATE_FULL_FORMATTER));

        Paragraph content = new Paragraph()
                .setFontSize(10.5f)
                .setFontColor(TEXT_DARK)
                .setMultipliedLeading(1.35f);

        String matriculeStr = reportData.getPrestataireMatricule() != null ? reportData.getPrestataireMatricule() : "—";
        content.add(new Paragraph("Prestataire : ").setBold()).add(reportData.getPrestataireNomComplet()).add("\n");
        content.add(new Paragraph("Matricule : ").setBold()).add(matriculeStr).add("\n");
        content.add(new Paragraph("Période : ").setBold()).add(periodStr).add("\n");
        content.add(new Paragraph("Généré le : ").setBold()).add(reportData.getGeneratedAt().format(DATE_FULL_FORMATTER));

        Cell cell = new Cell()
                .add(content)
                .setPadding(8)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.8f))
                .setBackgroundColor(ColorConstants.WHITE);

        boxTable.addCell(cell);
        document.add(boxTable);
    }

    private void addDailyDetailSection(Document document, ReportDataDTO reportData) {
        Paragraph title = new Paragraph("DÉTAIL DES POINTAGES")
                .setFontSize(12)
                .setBold()
                .setFontColor(TEXT_DARK)
                .setMarginBottom(6);
        document.add(title);

        Table table = new Table(UnitValue.createPercentArray(new float[]{13, 16, 17, 40, 14}))
                .useAllAvailableWidth()
                .setMarginBottom(16);

        // Header
        String[] headers = {"Date", "Jour", "Statut", "Créneaux", "Durée"};
        for (String h : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setBold().setFontSize(9.5f).setFontColor(TEXT_DARK))
                    .setBackgroundColor(TABLE_HEADER_BG)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(4)
                    .setBorder(new SolidBorder(BORDER_COLOR, 0.6f)));
        }

        // Data Rows
        for (ReportDataDTO.DailyAttendanceItem item : reportData.getDailyItems()) {
            String dateStr = item.getDate().format(DATE_SHORT_FORMATTER);
            String dayOfWeekStr = item.getDayOfWeek();
            String statutStr = item.getDayType() != null ? item.getDayType() : "Présent";

            String slotsStr = (item.getTimeSlots() != null && !item.getTimeSlots().isEmpty())
                    ? String.join(" | ", item.getTimeSlots())
                    : "—";

            String durationStr = (item.getDailyDurationHours() > 0)
                    ? item.getDailyDurationFormatted()
                    : "—";

            table.addCell(createTableCell(dateStr, TextAlignment.CENTER));
            table.addCell(createTableCell(dayOfWeekStr, TextAlignment.CENTER));
            table.addCell(createTableCell(statutStr, TextAlignment.CENTER));
            table.addCell(createTableCell(slotsStr, TextAlignment.CENTER));
            table.addCell(createTableCell(durationStr, TextAlignment.CENTER));
        }

        document.add(table);
    }

    private void addRecapSection(Document document, ReportDataDTO.SummaryMetrics metrics) {
        Paragraph title = new Paragraph("RÉCAPITULATIF")
                .setFontSize(12)
                .setBold()
                .setFontColor(TEXT_DARK)
                .setMarginBottom(6);
        document.add(title);

        Table table = new Table(UnitValue.createPercentArray(new float[]{65, 35}))
                .useAllAvailableWidth()
                .setMarginBottom(15);

        addRecapRow(table, "Jours ouvrables", String.valueOf(metrics.getTotalDays()));
        addRecapRow(table, "Jours présents", String.valueOf(metrics.getPresentDays()));
        addRecapRow(table, "Jours absents", String.valueOf(metrics.getAbsentDays()));
        addRecapRow(table, "Jours en congé", String.valueOf(metrics.getLeaveDays()));
        addRecapRow(table, "Total heures travaillées", metrics.getTotalWorkedHoursFormatted());
        addRecapRow(table, "Taux de présence", metrics.getAttendanceRateFormatted());

        document.add(table);
    }

    private void addRecapRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setFontSize(9.5f).setFontColor(TEXT_DARK).setBold())
                .setBackgroundColor(RECAP_LABEL_BG)
                .setPadding(4)
                .setPaddingLeft(8)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.6f));

        Cell valueCell = new Cell()
                .add(new Paragraph(value).setFontSize(9.5f).setFontColor(TEXT_DARK))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(4)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.6f));

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private Cell createTableCell(String text, TextAlignment alignment) {
        return new Cell()
                .add(new Paragraph(text).setFontSize(9).setFontColor(TEXT_DARK))
                .setTextAlignment(alignment)
                .setPadding(4)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.6f));
    }

    private Image loadLogoImage() {
        try {
            InputStream is = getClass().getResourceAsStream("/static/images/logo.png");
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                ImageData imageData = ImageDataFactory.create(bytes);
                Image img = new Image(imageData);
                img.scaleToFit(80, 60);
                return img;
            }
        } catch (Exception e) {
            // Fallback silently if image cannot be loaded
        }
        return null;
    }
}
