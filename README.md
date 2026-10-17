# PrestaFlow - Digital Attendance Management

**PrestaFlow** is a web application developed during my summer internship at **AXA Assurance Maroc – DSOT (Direction Stratégie, Opérations et Technologie)**. It aims to simplify and digitize the attendance management process for external service providers (*prestataires*).

The application centralizes attendance records, facilitates the validation process, and uses AI-assisted data extraction to reduce manual data entry from attendance documents and terminal images.

## Key Features

- **Attendance Management:** Manage attendance records and track their validation status.
- **AI-Assisted Data Extraction:** Extract attendance information from images using AI, with support for manual review and correction.
- **Validation Workflow:** Process attendance records through pending, approved, and rejected statuses.
- **User Authentication:** Secure authentication using Spring Security and JWT.
- **Administration:** Manage users and application data through administrative interfaces.
- **Document Management:** Integrate Alfresco Community for document storage and management.
- **PDF Reports:** Generate attendance reports in PDF format.
- **Data Persistence:** Store and organize attendance records in a MySQL database.

## Technologies Used

| Category | Technologies |
|---|---|
| Backend | Java, Spring Boot, Spring Security |
| Frontend | React, JavaScript, Tailwind CSS |
| Database | MySQL |
| Authentication | JWT |
| Document Management | Alfresco Community |
| AI Integration | Gemini API |
| Deployment & Tools | Docker, REST API |

## Architecture

PrestaFlow follows a client-server architecture:

- **Frontend:** React provides the user interface for managing attendance records and reviewing extracted information.
- **Backend:** Spring Boot exposes REST APIs and handles business logic, authentication, and validation workflows.
- **Database:** MySQL stores application data and attendance records.
- **AI Service:** Gemini API assists with extracting structured information from images.
- **Document Management:** Alfresco Community provides document storage and management capabilities.

## Attendance Processing Workflow

1. Attendance documents or terminal images are submitted to the application.
2. AI-assisted extraction identifies relevant attendance information.
3. Extracted data is reviewed and corrected when necessary.
4. The record is processed through the validation workflow.
5. Attendance information can be consulted and included in PDF reports.

## My Contributions

This project was developed individually during my summer internship at AXA Assurance Maroc – DSOT.

My work included:
- Designing and developing the web application using Spring Boot and React.
- Implementing REST APIs and JWT-based authentication.
- Developing attendance management and validation workflows.
- Integrating AI-assisted information extraction from images.
- Integrating Alfresco Community for document management using Docker.
- Implementing PDF report generation and database persistence.

## Project Context

**Project title:** Design and Development of a Digital Application for Service Provider Attendance Management

**Organization:** AXA Assurance Maroc — DSOT  
**Period:** June – August 2026  
**Type:** Individual internship project

---

*This project was developed as part of an internship. Source code and configuration details are subject to confidentiality requirements.*
