// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect, ConnectedProps} from 'react-redux';

import {savePreferences} from 'mattermost-redux/actions/preferences';

import {Preferences} from 'mattermost-redux/constants';

import {isClientDebuggingEnabled} from 'mattermost-redux/selectors/entities/general';
import {getBool, isPostFormattingEnabled} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import {GlobalState} from 'types/store';

import ClientDebuggingSection from './client_debugging_section';

function mapStateToProps(state: GlobalState) {
    return {
        currentUserId: getCurrentUserId(state),
        disableClientPlugins: getBool(state, Preferences.CATEGORY_CLIENT_DEBUGGING, Preferences.NAME_DISABLE_CLIENT_PLUGINS),
        enablePostFormatting: isPostFormattingEnabled(state),
        disableTelemetry: getBool(state, Preferences.CATEGORY_CLIENT_DEBUGGING, Preferences.NAME_DISABLE_TELEMETRY),
        disableTypingMessages: getBool(state, Preferences.CATEGORY_CLIENT_DEBUGGING, Preferences.NAME_DISABLE_TYPING_MESSAGES),
        performanceDebuggingEnabled: isClientDebuggingEnabled(state),
    };
}

const mapDispatchToProps = {
    savePreferences,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ClientDebuggingSection);
