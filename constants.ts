import { ChecklistItem, DealRoadmap, DocumentData, MondayItem, TaskMap } from "./types";

export const BRAND_COLORS = {
  darkEvergreen: '#0B3B2E',
  linksGreen: '#00A86B',
  gold: '#F4A024',
  white: '#FFFFFF',
  lightGray: '#F3F4F6'
};

// 1. roadmap.json mock
export const MOCK_ROADMAP: { deals: DealRoadmap[] } = {
  deals: [
    { deal_name: "Rich's 7-Site Deal", status: 'Closing', closing_date: '2023-11-15' },
    { deal_name: "Slappy's 5-Site Deal", status: 'Diligence', closing_date: '2023-12-01' },
    { deal_name: "Arcadia", status: 'Integration', closing_date: '2023-10-01' },
    { deal_name: "Clean As a Whistle", status: 'PSA', closing_date: '2024-01-15' },
    { deal_name: "Take 5 Anderson", status: 'Diligence', closing_date: '2023-12-20' },
    { deal_name: "Top Edge", status: 'PSA', closing_date: '2024-02-01' },
  ]
};

// 2. task_status.json mock
export const MOCK_TASK_STATUS: TaskMap = {
  "Rich's 7-Site Deal_R-1_Wire $1,000,000 Earnest Money": { status: "Completed", date: "2023-09-01", notes: "Confirmed receipt." },
  "Rich's 7-Site Deal_R-2_Phase I ESA Review": { status: "Completed", date: "2023-09-15", notes: "No REC identified." },
  "Rich's 7-Site Deal_R-3_Title Commitment Review": { status: "In Progress", date: "2023-10-20", notes: "Waiting on objection response." },
  "Rich's 7-Site Deal_R-Closing_Funding": { status: "Not Started", date: "", notes: "Scheduled for 11/14" },
  
  "Slappy's 5-Site Deal_R-1_PSA Execution": { status: "Completed", date: "2023-10-05", notes: "" },
  "Slappy's 5-Site Deal_R-2_Equipment Audit": { status: "In Progress", date: "2023-10-25", notes: "Site 3 pending access." },
  "Slappy's 5-Site Deal_CHK_POS Migration": { status: "Not Started", date: "", notes: "" },

  "Arcadia_Ops_Signage Installation": { status: "Completed", date: "2023-10-10", notes: "Rebranding complete." },
  "Clean As a Whistle_R-1_LOI Signed": { status: "Completed", date: "2023-11-01", notes: "" },
  "Clean As a Whistle_R-1_PSA Negotiation": { status: "In Progress", date: "2023-11-05", notes: "Redlines with counsel." },
};

// 3. documents.json mock
export const MOCK_DOCUMENTS: DocumentData[] = [
  {
    filename: "Richs_Portfolio_PSA_Executed.pdf",
    deal: "Rich's 7-Site Deal",
    needs_ocr: false,
    type: "PSA",
    summary: "Purchase and Sale Agreement for 7 car wash sites. Purchase Price: $14,500,000. Closing Date: Nov 15, 2023.",
    text_snippet: "Section 2.1 Purchase Price. The total purchase price shall be Fourteen Million Five Hundred Thousand Dollars ($14,500,000)."
  },
  {
    filename: "Arcadia_Phase1_ESA.pdf",
    deal: "Arcadia",
    needs_ocr: false,
    type: "ESA",
    summary: "Phase I ESA dated March 4, 2021 for 2307 SE Highway 70. No Recognized Environmental Conditions (RECs) found.",
    text_snippet: "Assessment revealed no evidence of RECs in connection with the property."
  },
  {
    filename: "Slappy_Site3_Title_Commitment.pdf",
    deal: "Slappy's 5-Site Deal",
    needs_ocr: true,
    type: "Title",
    summary: "Title Commitment for Slappy's Bryant Irvin location. Exception noted regarding utility easement on north boundary.",
    text_snippet: "Schedule B-II Exceptions: 14. Utility easement recorded in Vol 234, Page 11."
  },
  {
    filename: "Top_Edge_Financials_2022.xlsx",
    deal: "Top Edge",
    needs_ocr: false,
    type: "Financial",
    summary: "P&L Statement for FY 2022. EBITDA: $450k. Revenue: $1.2M.",
    text_snippet: "Net Income: $320,000. Total Operating Expenses: $780,000."
  }
];

// 4. checklist_data.json mock
export const MOCK_CHECKLIST: ChecklistItem[] = [
  { task: "Setup DRB Tunnel Controller", category: "Equipment", priority: "High" },
  { task: "Order Rebranding Signage", category: "Marketing", priority: "High" },
  { task: "Transfer Utility Accounts", category: "Utilities", priority: "Medium" },
  { task: "Configure POS Menu", category: "IT", priority: "High" },
  { task: "Staff Training - Links Culture", category: "HR", priority: "Medium" },
];

// 5. monday_data.json mock
export const MOCK_MONDAY: MondayItem[] = [
  { task: "Rich's Car Wash (Wallisville)", status: "Under Contract", date: "2023-09-01", deal_association: "Rich's 7-Site Deal" },
  { task: "Rich's Car Wash (Baytown)", status: "Under Contract", date: "2023-09-01", deal_association: "Rich's 7-Site Deal" },
  { task: "Rich's Car Wash (Crosby)", status: "Under Contract", date: "2023-09-01", deal_association: "Rich's 7-Site Deal" },
  { task: "Slappy's Bryant Irvin", status: "Diligence", date: "2023-10-05", deal_association: "Slappy's 5-Site Deal" },
  { task: "Slappy's McCart", status: "Diligence", date: "2023-10-05", deal_association: "Slappy's 5-Site Deal" },
  { task: "Arcadia, FL", status: "Integrated", date: "2023-08-15", deal_association: "Arcadia" },
  { task: "Take 5 Anderson Site", status: "Diligence", date: "2023-11-01", deal_association: "Take 5 Anderson" },
];