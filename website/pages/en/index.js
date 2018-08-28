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
    </div>
);

const Logo = props => (
    <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
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
        <GridBlock align="center" contents={props.blocks} layout={props.layout} />
    </Container>
);

const Connectors = () => (
    <Block
        background="light"
        layout="fourColumn"
        blocks={[
            {
                content: "Hyrest is written 100% in Typescript.",
                image: imgUrl("typescript.png"),
                imageAlign: "top",
                title: "100% Typescript",
            }, {
                content: "Utilize the official middleware to use Hyrest in your express application",
                image: imgUrl("express.png"),
                imageAlign: "top",
                title: "Express ready",
            }, {
                content: "Utilize the frontend support library for MobX to implement forms",
                image: imgUrl("mobx.png"),
                imageAlign: "top",
                title: "MobX ready",
            },
        ]}
    />
);

const Features = () => (
    <Block
        layout="fourColumn"
        blocks={[
            {
                content: "Develop a modern SPA stack with a separate frontend and backend application (or microservices) in one project.",
                image: imgUrl("code-branch-solid.svg"),
                imageAlign: "top",
                title: "Develop one project",
            }, {
                content: "Reduce the overhead of splitting your frontend and backend applications. Call Apis as if they were methods.",
                image: imgUrl("chart-line-solid.svg"),
                imageAlign: "top",
                title: "Reduce your overhead",
            }, {
                content: "Despite not dealing with REST at all - a full featured REST Api is generated and used internally.",
                image: imgUrl("magic-solid.svg"),
                imageAlign: "top",
                title: "Generate REST Apis",
            }, {
                content: "Easily replace or extend a Hyrest backend with any other REST service and continue to use Hyrest.",
                image: imgUrl("plug-solid.svg"),
                imageAlign: "top",
                title: "Stay compatible",
            }, {
                content: "Choose the stack that fits your project. Hyrest is 100% Framework agnostic.",
                image: imgUrl("stream-solid.svg"),
                imageAlign: "top",
                title: "Your project - your stack",
            }, {
                content: "Transparently make REST calls and stay typesafe.",
                image: imgUrl("shield-alt-solid.svg"),
                imageAlign: "top",
                title: "Typesafe REST Apis",
            }, {
                content: "Hyrest aims to be reliable and hence has 100% test coverage.",
                image: imgUrl("bug-solid.svg"),
                imageAlign: "top",
                title: "Fully tested",
            }, {
                content: "Transparently share logic between sub-applications by utilizing the hybrid REST features.",
                image: imgUrl("share-alt-square-solid.svg"),
                imageAlign: "top",
                title: "Share Logic",
            },
        ]}
    />
);

class Index extends React.Component {
    render() {
        return (
            <div>
                <SplashContainer>
                    <Logo img_src={imgUrl("hyrest-logo.svg")} />
                    <div className="inner">
                        <ProjectTitle />
                        <PromoSection>
                            <Button href={docUrl("introduction")}>Guide</Button>
                            <Button href={siteConfig.repoUrl}>GitHub</Button>
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
