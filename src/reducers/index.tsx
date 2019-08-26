import { combineReducers } from 'redux';
import * as fromPort from './PortReducer';
export const reducer = combineReducers ({PortReducer :  fromPort.PortReducer});