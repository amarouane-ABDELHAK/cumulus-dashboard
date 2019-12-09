'use strict';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import 'brace';
import 'brace/mode/json';
import 'brace/theme/github';

import Ace from 'react-ace';
import config from '../../config';
import { setWindowEditorRef } from '../../utils/browser';
import ErrorReport from '../Errors/report';

const _minLines = 8;
const _maxLines = 18;

class TextAreaForm extends React.Component {
  constructor () {
    super();
    this.displayName = 'TextAreaForm';
    this.onChange = this.onChange.bind(this);
  }

  onChange (value) {
    this.props.onChange(this.props.id, value);
  }

  render () {
    let {
      label,
      value,
      id,
      error,
      mode
    } = this.props;

    let minLines = this.props.minLines || _minLines;
    let maxLines = this.props.maxLines || _maxLines;

    return (
      <div className='form__textarea'>
        <label>{label}</label>
        <ErrorReport report={error} />
        <Ace
          mode={mode}
          theme={config.editorTheme}
          onChange={this.onChange}
          name={id}
          value={value}
          width='auto'
          tabSize={config.tabSize}
          showPrintMargin={false}
          minLines={minLines}
          maxLines={maxLines}
          wrapEnabled={true}
          ref={setWindowEditorRef}
        />
      </div>
    );
  }
}

TextAreaForm.propTypes = {
  label: PropTypes.any,
  value: PropTypes.string,
  id: PropTypes.string,
  error: PropTypes.any,
  mode: PropTypes.string,
  onChange: PropTypes.func,

  minLines: PropTypes.number,
  maxLines: PropTypes.number
};

export default connect(state => state)(TextAreaForm);
