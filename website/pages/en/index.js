const React = require("react");
const CompLibrary = require("../../core/CompLibrary.js");
const MarkdownBlock = CompLibrary.MarkdownBlock;
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;
const siteConfig = require(`${process.cwd()}/siteConfig.js`);

function imgUrl(img) { return `${siteConfig.baseUrl}img/${img}`; }
function docUrl(doc) { return `${siteConfig.baseUrl}docs/${doc}`; }
function pageUrl(page) { return`${siteConfig.baseUrl}${page}`; }

class Button extends React.Component {
    render() {
        return (
            <div className="pluginWrapper buttonWrapper">
                <a className="button" href={this.props.href} target={this.props.target}>
                    {this.props.children}
                </a>
            </div>
        );
    }
}

const SplashContainer = props => (
    <div className="homeContainer">
        <div className="homeSplashFade">
            <div className="wrapper homeWrapper">{props.children}</div>
        </div>
        <div className="embeddedLogo">
            <img src={imgUrl("hyrest-logo-monochrome-secondary.svg")} />
        </div>
    </div>
);

const ProjectTitle = () => (
    <h2 className="projectTitle">
        {siteConfig.title}
        <small>{siteConfig.tagline}</small>
    </h2>
);

const PromoSection = props => (
    <div className="section promoSection">
        <div className="promoRow">
            <div className="pluginRowBlock">{props.children}</div>
        </div>
    </div>
);

const Block = props => (
    <Container
        padding={["bottom", "top"]}
        id={props.id}
        background={props.background}
    >
        <GridBlock align="left" contents={props.blocks} layout={props.layout} />
    </Container>
);

const Connectors = () => (
    <Block
        layout="threeColumn"
        blocks={[
            {
                content: "Hyrest is written 100% Typescript and exposes a fully typesafe API.",
                image: imgUrl("typescript.png"),
                imageAlign: "top",
                title: "Typescript ready",
            }, {
                content: "Utilize the official middleware to use Hyrest in your express application.",
                image: imgUrl("express.png"),
                imageAlign: "top",
                title: "Express ready",
            }, {
                content: "Utilize the frontend support library for MobX to implement forms.",
                image: imgUrl("mobx.png"),
                imageAlign: "top",
                title: "MobX ready",
            },
        ]}
    />
);

const Features = () => (
    <Block
        background="light"
        layout="fourColumn"
        blocks={[
            {
                content: "Develop a modern SPA with separate frontend and backend applications in one project.",
                image: imgUrl("code-branch-solid.svg"),
                imageAlign: "left",
                title: "One project",
            }, {
                content: "Reduce the overhead of splitting your frontend and backend applications. Call Apis as if they were methods.",
                image: imgUrl("chart-line-solid.svg"),
                imageAlign: "left",
                title: "Less overhead",
            }, {
                content: "Despite not dealing with REST at all - a full featured REST Api is generated and used internally.",
                image: imgUrl("magic-solid.svg"),
                imageAlign: "left",
                title: "Generated Api",
            }, {
                content: "Easily replace or extend a Hyrest backend with any other REST service and continue to use Hyrest.",
                image: imgUrl("plug-solid.svg"),
                imageAlign: "left",
                title: "Compatible",
            }, {
                content: "Choose the stack that fits your project. Hyrest is 100% Framework agnostic.",
                image: imgUrl("stream-solid.svg"),
                imageAlign: "left",
                title: "Your stack",
            }, {
                content: "Transparently make REST calls and stay typesafe across your applications.",
                image: imgUrl("shield-alt-solid.svg"),
                imageAlign: "left",
                title: "Typesafe",
            }, {
                content: "Hyrest aims to be stable and reliable and hence has 100% test coverage.",
                image: imgUrl("bug-solid.svg"),
                imageAlign: "left",
                title: "Fully tested",
            }, {
                content: "Transparently share logic between sub-applications by utilizing the hybrid REST features.",
                image: imgUrl("share-alt-square-solid.svg"),
                imageAlign: "left",
                title: "Shared Logic",
            },
        ]}
    />
);

class Index extends React.Component {
    render() {
        return (
            <div>
                <SplashContainer>
                    <div className="inner">
                        <ProjectTitle />
                        <PromoSection>
                            <Button href={docUrl("preamble-about")}>Guide</Button>
                            <Button href={docUrl("tutorial-about")}>Tutorial</Button>
                            <Button href={siteConfig.repoUrl}>GitHub</Button>
                            <Button href={docUrl("api-about")}>API</Button>
                        </PromoSection>
                    </div>
                </SplashContainer>
                <div className="mainContainer">
                    <Connectors />
                    <Features />
                </div>
            </div>
        );
    }
}

module.exports = Index;
