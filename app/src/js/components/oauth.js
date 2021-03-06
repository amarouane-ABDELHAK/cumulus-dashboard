'use strict';

import React from 'react';
import { connect } from 'react-redux';
import withQueryParams from 'react-router-query-params';
import { withRouter } from 'react-router-dom';
import url from 'url';
import { login, setTokenState } from '../actions';
import { window } from '../utils/browser';
import { buildRedirectUrl } from '../utils/format';
import _config from '../config';
import PropTypes from 'prop-types';
import ErrorReport from './Errors/report';
import Header from './Header/header';
import Modal from 'react-bootstrap/Modal';

const { updateDelay, apiRoot, oauthMethod } = _config;

class OAuth extends React.Component {
  constructor () {
    super();
    this.state = {
      token: null,
      error: null
    };
  }

  componentDidUpdate (prevProps) {
    // delay-close the modal if it's open
    if (this.props.api.authenticated &&
        this.props.api.authenticated !== prevProps.api.authenticated) {
      prevProps.dispatch(setTokenState(this.state.token));
      const { pathname } = prevProps.location;
      if (pathname !== '/auth' && window.location && window.location.reload) {
        setTimeout(() => window.location.reload(), updateDelay);
      } else if (pathname === '/auth') {
        setTimeout(() => this.props.history.push('/'), updateDelay); // react isn't seeing this a function
      }
    }
  }

  componentDidMount () {
    const { token } = this.props.queryParams;
    if (token) {
      const { dispatch } = this.props;
      this.setState({ token }, () => dispatch(login(token))); // eslint-disable-line react/no-did-mount-set-state
    }
  }

  render () {
    const { dispatch, api, apiVersion } = this.props;
    let button;
    if (!api.authenticated && !api.inflight) {
      const redirect = buildRedirectUrl(window.location);
      if (oauthMethod === 'launchpad') {
        button = <div style={{textAlign: 'center'}}><a className="button button--oauth" href={url.resolve(apiRoot, `saml/login?RelayState=${redirect}`)}>Login with Launchpad</a></div>;
      } else {
        button = <div style={{textAlign: 'center'}}><a className="button button--oauth" href={url.resolve(apiRoot, `token?state=${redirect}`)} >Login with Earthdata Login</a></div>;
      }
    }

    return (
      <div className='app'>
        <Header dispatch={dispatch} api={api} apiVersion={apiVersion} minimal={true}/>
        <main className='main' role='main'>
          <div className="modal-content">
            <Modal
              dialogClassName="oauth-modal"
              show= {true}
              centered
              size="sm"
              aria-labelledby="modal__oauth-modal"
            >
              <Modal.Header className="oauth-modal__header"></Modal.Header>
              <Modal.Title id="modal__oauth-modal" className="oauth-modal__title">Welcome To Cumulus Dashboard</Modal.Title>
              <Modal.Body>
                { api.inflight ? <h2 className='heading--medium'>Authenticating ... </h2> : null }
                { api.error ? <ErrorReport report={api.error} /> : null }
              </Modal.Body>
              <Modal.Footer>
                { button }
              </Modal.Footer>
            </Modal>
          </div>
        </main>
      </div>
    );
  }
}

OAuth.propTypes = {
  dispatch: PropTypes.func,
  api: PropTypes.object,
  location: PropTypes.object,
  history: PropTypes.object,
  apiVersion: PropTypes.object,
  queryParams: PropTypes.object
};

export default withRouter(withQueryParams()(connect(state => state)(OAuth)));
