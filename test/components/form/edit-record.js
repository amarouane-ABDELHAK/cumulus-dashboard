'use strict';

import 'jsdom-global/register';
import test from 'ava';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { mount, configure } from 'enzyme';
import {
  getProvider,
  updateProvider,
  clearUpdateProvider
} from '../../../app/src/js/actions';
import { EditRecord } from '../../../app/src/js/components/Edit/edit.js';

configure({ adapter: new Adapter() });

test('EditRecord sends full object when merge property is true', (t) => {
  const monkeyInTheMiddle = () =>
    // Simply unwrap the simple action from the complex action and pass it
    // along to the reducer.  We get `action` as { "undefined": simpleAction },
    // so we're extracting the single value (simpleAction) for the reducer.
    (next) => (action) => next(Object.values(action)[0]);
  const mockStore = configureMockStore([monkeyInTheMiddle]);
  const provider = { id: 123, foo: 'bar' };
  const providersState = { map: { [provider.id]: { data: provider } } };
  const schemaKey = 'provider';
  const schema = { [schemaKey]: {} };
  const store = mockStore({});

  const editRecordWrapper = mount(
    <Provider store={store}>
      <EditRecord
        schema={schema}
        dispatch={store.dispatch}
        merge={true}
        pk={`${provider.id}`}
        schemaKey={schemaKey}
        state={providersState}
        getRecord={getProvider}
        updateRecord={updateProvider}
        clearRecordUpdate={clearUpdateProvider}
        backRoute={`providers/provider/${provider.id}`}
      />
    </Provider>
  );

  const submitButton = editRecordWrapper.find('.button__submit');

  store.clearActions();
  submitButton.simulate('click');

  t.is(store.getActions().length, 1);
  t.deepEqual(store.getActions()[0].body, provider);
});
