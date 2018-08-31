module.exports = {
    title: "Hyrest",
    tagline: "Hyrest Documentation",
    url: "https://prior99.github.io/hyrest",
    baseUrl: "/hyrest/",
    projectName: "hyrest-docs",
    organizationName: "hyrest",
    headerLinks: [
        { doc: "preamble-about", label: "Guide" },
        { doc: "tutorial-about", label: "Tutorial" },
        { doc: "api-about", label: "API" }
    ],
    headerIcon: "img/hyrest-logo-monochrome.svg",
    footerIcon: "img/hyrest-logo-monochrome.svg",
    ogImage: "img/hyrest-logo-100px.png",
    twitterImage: "img/hyrest-100px.png",
    favicon: "img/favicon.png",
    colors: {
        primaryColor: "#0046e8",
        secondaryColor: "#3a75ff",
    },
    copyright: `Copyright © ${new Date().getFullYear()} Frederick Gnodtke`,
    highlight: {
        theme: "default",
    },
    scripts: ["https://buttons.github.io/buttons.js"],
    onPageNav: "separate",
    repoUrl: "https://github.com/prior99/hyrest",
};
