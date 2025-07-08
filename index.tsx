/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import * as marked from 'marked';

// --- DOM Elements ---
const chatHistory = document.getElementById('chat-history')!;
const chatForm = document.getElementById('chat-form')!;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = chatForm.querySelector('button')!;
const promptSuggestions = document.getElementById('prompt-suggestions')!;

// --- Gemini AI Setup ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  chatHistory.innerHTML =
    '<div class="ai-message"><strong>Error:</strong> API_KEY is not set. Please configure your environment.</div>';
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Syllabus Content ---
const syllabusText = `
ENTERPRISE STATE COMMUNITY COLLEGE
Syllabus: CIS 275 - Workstation Administration
3 Credit/Semester Hours

## Course Information
**Course Description:** This course provides a study of client system administration in a network environment. Topics include installing, monitoring, maintaining, and troubleshooting client operating system software and managing hardware devices and shared resources. Students gain hands-on experience in client operating system installation and basic administration of network workstations.
**Prerequisite(s):** None
**Mode of Delivery:** Online
**Location:** Online
**Dates:** August 18, 2025 – December 11, 2025

## Instructor Information
**Name:** Mr. Lee Scarborough
**Office Location:** Forrester Hall 105
**Office Hours:**
*   Monday & Wednesday: 8:00-9:00 am, 10:15-11:00 am, 2:30-4:00 pm
*   Tuesday & Thursday: 8:00 - 9:00 am, 10:15 – 11:00 am, 11:30 am - 1:00 pm, 2:15 - 4:00 pm
**Phone:** (334) 348-4923 (call or text)
**Email:** lscarborough@escc.edu
**Microsoft Teams:** "schedule a virtual meeting with me" link is available.
**Response Time to Grading:** I will return graded assignments within 7 days of due date.
**Response Time to Email:** I will respond within 24 hours Monday through Thursday. Friday through Sunday emails will be responded to on Monday, though possibly sooner.

## Division Information:
**Chair Name:** Jennifer Nelson
**Office Location:** Forrester Hall 103
**Phone:** (334) 347-2623 ext. 2338
**Email:** jnelson@escc.edu

## Textbooks, Supplies, and Materials
1.  **Required:** uCertify Endpoint Administrator (MD-102). This is a **Digital access code only**. There is no physical book. Purchase your access code through the ESCC bookstore: https://bookstore.escc.edu/textbooks. You must contact the bookstore to receive your access code (Email: bookstore@escc.edu, Call: 334-347-2623, or Visit in-person).
2.  **Materials and equipment to be used by instructor:** Canvas LMS, uCertify Learning Platform.

## Course Objectives
1.  Deploy Windows client
2.  Manage identity and compliance
3.  Manage, maintain, and protect devices
4.  Manage applications

## Methods of Instruction and Evaluation
*   **Quizzes:** 30% of final grade.
*   **Labs:** 30% of final grade (via uCertify).
*   **Exams:** 20% of final grade (one proctored quiz, practice exams, one final exam).
*   **Discussions:** 20% of final grade.

## Course Requirements and Grading Criteria
**Dropped grades:** 1 lowest exam grade, 1 lowest lab grade, 2 lowest quiz grades, and 2 lowest discussion grades will be dropped.
**Grading scale:** A = 90-100%, B = 80-89%, C = 70-79%, D = 60-69%, F = 0-59%

## Course Policies
**Assignment Guidelines:** Submit all assignments by the due date listed in Canvas.
**Grade Penalties:** Work not submitted by the due date will be given a zero for that assignment.
**Extenuating circumstances:** Considered if notice is provided at least 24 hours prior to the due date, or within 24 hours after. Documentation may be required.
**Final Grades:** Posted to the Student Information Center via the MyESCC link, not on Canvas, email, or phone.

## Proctoring Policy
This course uses remote proctoring (Honorlock) for exams. Students must install a Chrome extension, provide a valid photo ID (driver's license, passport, etc.), and scan the testing environment. **An external USB webcam is required** with at least 720p resolution. A built-in laptop camera is NOT sufficient. Do NOT purchase the Walmart Branded Camera (ONN).

## Attendance and Withdrawal Policy
The last day to withdraw without academic penalty is July 24th.

## Academic Honesty
All work must be original for this course. Plagiarism will result in a zero on the assignment, an F in the course, and will be reported.

## Artificial Intelligence (AI)
Students are encouraged to use AI as a tool to assist with learning, especially for revising and improving their own writing for discussion assignments. Submitting work that is not your own is a violation of the Academic Honesty policy.

## Course Outline
*   Aug 18 - 25: Start Here - attendance verification quiz (Due Aug 22)
*   Aug 25 - Sep 8: Lesson 1: Configuring Users (Due Sep 8)
*   Sep 8 - 22: Lesson 2: Deploy Windows Client (Due Sep 22)
*   Sep 22 - Oct 6: Lesson 3: Managing Identify and Access (Due Oct 6)
*   Oct 6 - 20: Lesson 4: Planning and Managing Microsoft Intune (Due Oct 20)
*   Oct 20 - Nov 3: Lesson 5: Managing Devices (Due Nov 3)
*   Nov 3 - 17: Lesson 6: Managing Security (Due Nov 17)
*   Nov 17 - 24: Lesson 7: Monitoring Devices (Due Nov 24)
*   Nov 24 - 28: Thanksgiving Holidays
*   Dec 1 - 8: Exam review (Due Dec 8)
*   Dec 8 - 11: Final exam (Due Dec 11)

## Disability Services
Contact Dava Leverette (dleverette@escc.edu) for accommodations.
`;

const systemInstruction = `You are a helpful and friendly chatbot for students of the CIS 275 course. Your name is "CIS 275 Course Assistant".

You must answer questions based *only* on the provided syllabus text.

If the answer is not found in the syllabus, you must state that you cannot find the information in the syllabus. Do not make up answers.

Be concise in your responses. Format your answers clearly using markdown where appropriate (like lists or bolding).`;

// --- Chat Logic ---
const setFormState = (enabled: boolean) => {
  chatInput.disabled = !enabled;
  sendButton.disabled = !enabled;
};

const appendMessage = async (
  text: string,
  sender: 'user' | 'ai' | 'loading'
) => {
  const messageDiv = document.createElement('div');
  const messageClass =
    sender === 'loading' ? 'loading-message' : `${sender}-message`;
  messageDiv.classList.add('message', messageClass);

  if (sender === 'loading') {
    messageDiv.innerHTML = '<span></span><span></span><span></span>';
  } else {
    // Sanitize and render markdown for AI messages
    const parsedHtml = await marked.parse(text);
    messageDiv.innerHTML = parsedHtml;
  }

  chatHistory.appendChild(messageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return messageDiv;
};

const askSyllabus = async (question: string) => {
  setFormState(false);
  await appendMessage(question, 'user');
  const loadingIndicator = await appendMessage('', 'loading');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: question,
      config: {
        systemInstruction: `${systemInstruction}\n\nSYLLABUS:\n${syllabusText}`,
      },
    });

    const answer = response.text;
    chatHistory.removeChild(loadingIndicator);
    await appendMessage(answer, 'ai');
  } catch (error) {
    console.error(error);
    chatHistory.removeChild(loadingIndicator);
    await appendMessage(
      'Sorry, something went wrong while trying to answer your question. Please try again.',
      'ai'
    );
  } finally {
    setFormState(true);
    chatInput.focus();
  }
};

const createPromptButtons = () => {
  const prompts = [
    'Instructor contact',
    'Course materials',
    'Attendance Verification Quiz',
    'Course schedule',
    'Proctoring requirements',
  ];

  prompts.forEach((promptText) => {
    const button = document.createElement('button');
    button.textContent = promptText;
    button.classList.add('prompt-button');
    button.addEventListener('click', () => {
      if (!chatInput.disabled) {
        askSyllabus(promptText);
      }
    });
    promptSuggestions.appendChild(button);
  });
};

// --- Event Listeners ---
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = chatInput.value.trim();
  if (question && !chatInput.disabled) {
    askSyllabus(question);
    chatInput.value = '';
  }
});

// Initial greeting
if (API_KEY) {
  appendMessage(
    "Hello! I can assist you in finding answers about the course. Keep in mind I am not a tutor. For those types of questions you will need to ask your instructor.",
    'ai'
  );
  createPromptButtons();
}
