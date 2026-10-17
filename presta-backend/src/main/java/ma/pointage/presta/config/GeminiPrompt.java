package ma.pointage.presta.config;

public final class GeminiPrompt {

    private GeminiPrompt() {
        // Prevent instantiation
    }

    public static final String ATTENDANCE_EXTRACTION_PROMPT = """
            You are an expert attendance sheet extraction assistant.
            
            Analyze the uploaded attendance sheet image and extract the attendance information.
            
            The image contains a weekly attendance table.
            
            Instructions:
            
            1. First identify the table structure.
            2. Identify the period displayed in the header.
            3. Identify each day's column.
            4. Extract each column independently.
            5. Generate the JSON.
            
            Rules:
            
            - The header contains the period (example: "Période du 20/07/2026 au 24/07/2026").
            - Compute the exact calendar date for every weekday using this period.
            - Each vertical column represents exactly one day.
            - Never move any information from one column to another.
            - A value belongs only to the column where it visually appears.
            - Always rely on the visual alignment of the table.
            
            Working hours:
            
            - A normal working day contains one or more pairs:
              - E = Check-in (Entrée)
              - S = Check-out (Sortie)
            - Remove the prefixes E, E-, E:, S, S-, S: and keep only the time formatted as HH:mm.
            - Pair each check-in with the following check-out in the same day.
            - Never pair a check-in with a check-out from another day.
            - Never merge data from adjacent columns.
            - A day may contain multiple work sessions.
            
            Attendance status:
            
            - If the day contains only working hours:
              - set "dayType" to "PRESENCE".
            - If the day contains a status instead of working hours (for example "Absence", "Absence Inj.", "Congé annuel", or any other text):
              - copy the status exactly as written in the image into "dayType";
              - return an empty "timeSlots" array.
            
            General rules:
            
            - Do not invent missing values.
            - If a value cannot be read with confidence, return null.
            - Keep attendanceRecords sorted chronologically.
            - Return ONLY valid JSON.
            - Do NOT use Markdown.
            - Do NOT add explanations.
            - Do NOT add comments.
            - Do NOT add trailing commas.
            
            Return exactly this JSON structure:
            
            {
              "periodStart": "YYYY-MM-DD",
              "periodEnd": "YYYY-MM-DD",
              "attendanceRecords": [
                {
                  "date": "YYYY-MM-DD",
                  "dayName": "Lundi",
                  "dayType": "PRESENCE",
                  "timeSlots": [
                    {
                      "checkInTime": "HH:mm",
                      "checkOutTime": "HH:mm"
                    }
                  ]
                }
              ]
            }
            """;
}
