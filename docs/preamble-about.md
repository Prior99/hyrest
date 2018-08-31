---
id: preamble-about
title: About
---

Hyrest is a framework for developing modern (web) applications full-stack in [Typescript](https://www.typescriptlang.org/).

This preamble does not only want to introduce you into using Hyrest, but aims to also help you designing the stack for your application
from the ground up.

Hyrest provides and utilizes many design patterns which make developing your application fast, scalable and understandable.
This guide wants to introduce you to some of these.

Before diving right [into the tutorial](tutorial-about) and starting to develop your application, you should carefully read this guide,
decide what set of patterns, decisions and technologies is the correct one for your project.

After reading this guide you will know whether you should use Hyrest at all and hopefully have a better understanding about how to structure your web project.

## About the state of web development

The web now has been around for a while and many ways of getting your content out have been found since:

- [Handwritten static HTML pages](https://en.wikipedia.org/wiki/HTML)
- [Static Site generators](https://www.staticgen.com/)
- [Server-side (template) rendering](https://en.wikipedia.org/wiki/Server-side_scripting)
- [Single-page Applications](https://en.wikipedia.org/wiki/Single-page_application)
- [Interactive editors](https://en.wikipedia.org/wiki/List_of_HTML_editors)
- [Hosted solutions](https://en.wikipedia.org/wiki/Blog)
- [Websites in the Blockchain](https://www.reddit.com/r/Bitcoin/comments/544iwk/host_webpage_on_blockchain/)
- ...

While probably all of these solutions have their optimal use-cases, it is not always obvious or foreseeable what to choose and of course not all solutions are fit for all purposes.

Before starting to develop anything, or even select a stack it is crucial to decide which way to go.

## About this preamble

**Before diving into Hyrest, This guide wants to help you decide for the correct stack for your application.**
Instead of simply listing [some of Hyrest's features with examples](api-about) here, it aims to enable you to design and setup the architecture for your project on your own.

For this, the following topics will be discussed:

1. **[Documents and Applications](preamble-documents-applications)**. Figuring out whether it is a document or an application you are developing and locating your project in the Document-to-application continuum can help you figure out how scalable your stack needs to be.
2. General **[anatomy](preamble-anatomy)** of a single-page application stack. Hyrest targets medium sized projects with separate frontend and backend applications. A rough understanding of frontend and backend architecture in the context of single-page applications will be given in this section.
3. By discussing the **[problems of SPAs](preamble-problems-with-spas)** in comparison to template-rendering the problems solved by Hyrest will be outlined.
4. **[Existing approaches](preamble-existing-approaches)** for solving the problems outlined in [Problems with SPAs](preamble-problems-with-spas) exist and you should consider whether these might be more fit-for-purpose in the context of your project.
