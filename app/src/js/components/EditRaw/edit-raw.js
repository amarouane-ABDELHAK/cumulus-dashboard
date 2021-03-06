'use strict';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { get } from 'object-path';
import { getSchema } from '../../actions';
import { removeReadOnly } from '../FormSchema/schema';
import { displayCase } from '../../utils/format';
import Loading from '../LoadingIndicator/loading-indicator';
import TextArea from '../TextAreaForm/text-area';
import DefaultModal from '../Modal/modal';
import _config from '../../config';

const { updateDelay } = _config;

const defaultState = {
  pk: null,
  data: '',
  error: null
};

const EditRaw = ({
  state,
  dispatch,
  history,
  backRoute,
  getRecord,
  updateRecord,
  clearRecordUpdate,
  pk,
  schema,
  schemaKey,
  hasModal,
  type,
  ModalBody
}) => {
  const [record, setRecord] = useState(defaultState);
  const [showModal, setShowModal] = useState(false);
  const { data, pk: recordPk, error } = record;
  const { updated, map: stateMap } = state;
  const updateStatus = get(updated, [pk, 'status']);
  const errorMessage = get(updated, [pk, 'error']);
  const isSuccess = updateStatus === 'success';
  const isInflight = updateStatus === 'inflight';
  const isError = !!error;
  const buttonText = isInflight ? 'loading...'
    : isSuccess ? 'Success!' : 'Submit';

  // get record and schema
  // ported from componentDidMount
  useEffect(() => {
    if (!stateMap[pk]) {
      dispatch(getRecord(pk));
    }
    if (!schema[schemaKey]) {
      dispatch(getSchema(schemaKey));
    }
  }, [dispatch, pk, stateMap, getRecord, schema, schemaKey]);

  // Handle effects of an update success or error
  useEffect(() => {
    if (!hasModal && isSuccess) {
      setTimeout(() => {
        dispatch(clearRecordUpdate(pk));
        history.push(backRoute);
      }, updateDelay);
    }
    if (updateStatus === 'error' && !isError) {
      setRecord({ ...record, error: errorMessage });
    }
  }, [hasModal, isSuccess, updateStatus, isError, dispatch, clearRecordUpdate, pk, history, backRoute, record, errorMessage]);

  // ported from componentDidUpdate
  useEffect(() => {
    if (recordPk === pk || !schema[schemaKey]) { return; }
    const recordSchema = schema[schemaKey];

    const newRecord = stateMap[pk] || {};
    if (newRecord.error) {
      setRecord({
        pk,
        data: '',
        error: newRecord.error
      });
    } else if (newRecord.data) {
      let data = removeReadOnly(newRecord.data, recordSchema);
      try {
        var text = JSON.stringify(data, null, '\t');
      } catch (error) {
        setRecord({ ...record, error, pk });
      }
      setRecord({
        pk,
        data: text,
        error: null
      });
    } else if (!newRecord.inflight && !stateMap[pk]) {
      dispatch(getRecord(pk));
    }
  }, [recordPk, pk, schema, schemaKey, stateMap, dispatch, record, getRecord]);

  function onSubmit (e) {
    e.preventDefault();
    if (updateStatus === 'inflight') { return; }
    try {
      var json = JSON.parse(data);
    } catch (e) {
      return setRecord({ ...record, error: 'Syntax error in JSON' });
    }
    setRecord({ ...record, error: null });
    console.log('About to update', json);
    dispatch(updateRecord(json));
  }

  function handleCancel () {
    if (isError) {
      dispatch(clearRecordUpdate(pk));
    }
    history.push(backRoute);
  }

  function onChange (id, value) {
    setRecord({ ...record, data: value });
  }

  function handleOpenModal (e) {
    e.preventDefault();
    setShowModal(true);
    onSubmit(e);
  }

  function handleModalConfirm (e) {
    setShowModal(false);
    dispatch(clearRecordUpdate(pk));
  }

  function handleCloseModal () {
    setShowModal(false);
    if (!isError) {
      handleCancel();
    }
  }

  const handleSubmit = hasModal ? handleOpenModal : onSubmit;

  return (
    <div className='page__component'>
      <section className='page__section'>
        <div className="heading__wrapper--border">
          <h1 className='heading--large'>{pk}</h1>
        </div>
        { data || data === '' ? (
          <form>
            <TextArea
              value={data}
              id={`edit-${pk}`}
              error={error}
              onChange={onChange}
              mode={'json'}
              minLines={1}
              maxLines={200}
            />
            <button
              className={'button button--submit button__animation--md button__arrow button__arrow--md button__animation button__arrow--white form-group__element--right' + (updateStatus === 'inflight' ? ' button--disabled' : '')}
              onClick={handleSubmit}
              value={buttonText}
            >{hasModal ? 'Submit' : buttonText}</button>
            <button
              className='button button--cancel button__animation--md button__arrow button__arrow--md button__animation button--secondary form-group__element--right'
              onClick={handleCancel}
            >Cancel</button>
          </form>
        ) : <Loading /> }
      </section>
      {hasModal &&
      <DefaultModal
        showModal={showModal}
        className={`edit-${type}`}
        onCloseModal={handleCloseModal}
        onConfirm={isError ? handleModalConfirm : handleCloseModal}
        onCancel={handleCancel}
        title={`Edit ${displayCase(type)}`}
        hasCancelButton={isError}
        cancelButtonText={isError ? 'Cancel Request' : null}
        confirmButtonText={isError ? 'Go To Collection' : 'Close'}
        confirmButtonClass={isError ? 'button__goto' : 'button--green button--close'}
      >
        <ModalBody isError={isError} isSuccess={isSuccess} isInflight={isInflight} error={error} />
      </DefaultModal>}
    </div>
  );
};

EditRaw.propTypes = {
  dispatch: PropTypes.func,
  pk: PropTypes.string,
  schema: PropTypes.object,
  schemaKey: PropTypes.string,
  state: PropTypes.object,
  backRoute: PropTypes.string,
  history: PropTypes.object,
  getRecord: PropTypes.func,
  updateRecord: PropTypes.func,
  clearRecordUpdate: PropTypes.func,
  hasModal: PropTypes.bool,
  type: PropTypes.string,
  ModalBody: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func
  ])
};

export default withRouter(connect(state => ({
  schema: state.schema
}))(EditRaw));
