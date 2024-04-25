# Site Summariser

## Table of Contents
- [Site Summariser](#site-summariser)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Overall Design](#overall-design)
  - [Components](#components)
    - [Popup (Home page)](#popup-home-page)
    - [Settings Page](#settings-page)
    - [Background Service Worker](#background-service-worker)
    - [Content Script](#content-script)
    - [SummarisationOptions](#summarisationoptions)

## Introduction
This is an extension that summarises the content of a webpage. It provides the use of multiple providers to have access to different implementations and usages, including an array of customisable features. This documentation provides a general high level overview of the extension implementation for use of editing, building off of and understanding the code. It is only serving as an introduction to this project, where code should be explored for further understanding. The code is heavily commented and documented for ease of understanding.

## Installation
Follow the README.txt file for installation instructions

## Overall Design

The popup (home page) is the main interface for the user to interact with the extension. The settings page is used to configure the extension and customisation of summarisation. The background service worker is used to manage the extension, primarily handling requests to different providers. The content script is used to interact with the webpage - purpose of extracting content. The APIClasses are used to interact with the custom backend service (SSBE-Backend) to populate the the model options for the user to see and use for summarisation.

## Components

Please note that it is not an exhaustive list of all the components in the extension, but rather a high level overview of the main components.

### Popup (Home page)

- Handles user interaction with the extension
- Allows user to summarise the current page
- Access to settings page
- Save summaries
- Switch between providers (ChatGPT/OpenAI, Backend Service)
- Backend Service
  - Select domain text type
  - Select summary type
  - Select model
  - Select summarisation length
- ChatGPT/OpenAI
  - Select prompt
- Communicates with background service worker to retrieve summaries and model descriptors to populate the options to the user
- Communicates with content script to extract content from the current page for summarisation
- Loads user settings from storage
- Provides contextual information / feedback to the user (e.g. summarisation progress, errors)

### Settings Page
- Load and save user settings
- Create, edit, delete ChatGPT/OpenAI prompts
- Communicates with background service worker to retrieve model descriptors to populate the options to the user (for backend service provider option)
- Provides per site customisation (e.g. summarisation length, model, summary type), including access to a custom sraping mode (using xpath to traverse the DOM)
- Provides user feedback (e.g. errors, success messages)
- Provides user with information on how to use the extension / settings
- Connect/login and sign up to the backend service
- Fill in user API host and key requirements for ChatGPT/OpenAI

### Background Service Worker
- Manages network requests to different providers (ChatGPT/OpenAI, Backend Service)
- Handles requests to the backend service for model descriptors
- Handles summarisation requests

### Content Script
- Extracts content from the current page
- Automatic implementation of extracting content from the page
- XPath implementation for custom scraping mode
- Provides chunking of content for ChatGPT/OpenAI summarisation

### SummarisationOptions
- Controller and View classes to provide the user with the options for summarisation with the backend service
- Controller class handles the logic for the view, traversing the tree of options and updating the current selection
- View class handles the rendering of the options to the user
- Used in the popup and settings page (per site customisation) to provide the user with the options for summarisation

