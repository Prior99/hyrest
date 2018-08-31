/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return `${baseUrl}docs/${language ? `${language}/` : ''}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('preamble-about')}>Guide</a>
            <a href={this.docUrl('tutorial-about')}>Tutorial</a>
            <a href={this.docUrl('api-about')}>API</a>
          </div>
          <div>
            <h5>Community</h5>
            <a
              href="http://stackoverflow.com/questions/tagged/hyrest"
              target="_blank"
              rel="noreferrer noopener">
              Stack Overflow
            </a>
            <a
              href="https://github.com/Prior99/hyrest/issues"
              target="_blank"
              rel="noreferrer noopener">
              Issues
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://fontawesome.com">Icons by Fontawesome</a>
            <a href="https://github.com/prior99/hyrest">GitHub</a>
            <a href="https://gitlab.com/prior99/hyrest/pipelines">CI/CD</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/prior99/hyrest/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub">
              Star
            </a>
          </div>
        </section>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
