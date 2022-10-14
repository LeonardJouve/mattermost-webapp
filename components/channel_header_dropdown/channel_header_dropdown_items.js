// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';

import {Permissions} from 'mattermost-redux/constants';

import {Constants, ModalIdentifiers} from 'utils/constants';
import {localizeMessage} from 'utils/utils';
import {isGuest} from 'mattermost-redux/utils/user_utils';

import MobileChannelHeaderPlug from 'plugins/mobile_channel_header_plug';

import CategoryMenuItems from 'components/category_menu_items';
import ChannelNotificationsModal from 'components/channel_notifications_modal';
import ChannelInviteModal from 'components/channel_invite_modal';
import EditChannelHeaderModal from 'components/edit_channel_header_modal';
import EditChannelPurposeModal from 'components/edit_channel_purpose_modal';
import RenameChannelModal from 'components/rename_channel_modal';
import ConvertChannelModal from 'components/convert_channel_modal';
import DeleteChannelModal from 'components/delete_channel_modal';
import UnarchiveChannelModal from 'components/unarchive_channel_modal';
import MoreDirectChannels from 'components/more_direct_channels';
import AddGroupsToChannelModal from 'components/add_groups_to_channel_modal';
import ChannelGroupsManageModal from 'components/channel_groups_manage_modal';

import ChannelPermissionGate from 'components/permissions_gates/channel_permission_gate';

import Menu from 'components/widgets/menu/menu';

import MenuItemLeaveChannel from './menu_items/leave_channel';
import MenuItemCloseChannel from './menu_items/close_channel';
import MenuItemCloseMessage from './menu_items/close_message';
import MenuItemToggleMuteChannel from './menu_items/toggle_mute_channel';
import MenuItemToggleFavoriteChannel from './menu_items/toggle_favorite_channel';
import MenuItemViewPinnedPosts from './menu_items/view_pinned_posts';
import MenuItemToggleInfo from './menu_items/toggle_info';
import MenuItemOpenMembersRHS from './menu_items/open_members_rhs';

export default class ChannelHeaderDropdown extends React.PureComponent {
    static propTypes = {
        user: PropTypes.object.isRequired,
        channel: PropTypes.object.isRequired,
        isDefault: PropTypes.bool.isRequired,
        isFavorite: PropTypes.bool.isRequired,
        isReadonly: PropTypes.bool.isRequired,
        isMuted: PropTypes.bool.isRequired,
        isArchived: PropTypes.bool.isRequired,
        isMobile: PropTypes.bool.isRequired,
        penultimateViewedChannelName: PropTypes.string.isRequired,
        pluginMenuItems: PropTypes.arrayOf(PropTypes.object),
        isLicensedForLDAPGroups: PropTypes.bool,
    }

    render() {
        const {
            user,
            channel,
            isDefault,
            isFavorite,
            isMuted,
            isReadonly,
            isArchived,
            isMobile,
            penultimateViewedChannelName,
            isLicensedForLDAPGroups,
        } = this.props;

        const isPrivate = channel.type === Constants.PRIVATE_CHANNEL;
        const isGroupConstrained = channel.group_constrained === true;
        const channelMembersPermission = isPrivate ? Permissions.MANAGE_PRIVATE_CHANNEL_MEMBERS : Permissions.MANAGE_PUBLIC_CHANNEL_MEMBERS;
        const channelPropertiesPermission = isPrivate ? Permissions.MANAGE_PRIVATE_CHANNEL_PROPERTIES : Permissions.MANAGE_PUBLIC_CHANNEL_PROPERTIES;
        const channelDeletePermission = isPrivate ? Permissions.DELETE_PRIVATE_CHANNEL : Permissions.DELETE_PUBLIC_CHANNEL;
        const channelUnarchivePermission = Permissions.MANAGE_TEAM;

        let divider;
        if (isMobile) {
            divider = (
                <li className='MenuGroup mobile-menu-divider'>
                    <hr/>
                </li>
            );
        }

        const pluginItems = this.props.pluginMenuItems.map((item) => {
            return (
                <Menu.ItemAction
                    id={item.id + '_pluginmenuitem'}
                    key={item.id + '_pluginmenuitem'}
                    onClick={() => {
                        if (item.action) {
                            item.action(this.props.channel.id);
                        }
                    }}
                    text={item.text}
                />
            );
        });

        return (
            <React.Fragment>
                <MenuItemToggleInfo
                    show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL}
                    channel={channel}
                />
                <CategoryMenuItems
                    channel={channel}
                    openUp={false}
                    location={'channel'}
                />
                <Menu.Group divider={divider}>
                    <MenuItemToggleFavoriteChannel
                        id='channelToggleFavorite'
                        show={isMobile}
                        channel={channel}
                        isFavorite={isFavorite}
                    />
                    <MenuItemViewPinnedPosts
                        id='channelViewPinnedPosts'
                        show={isMobile}
                        channel={channel}
                    />
                    <Menu.ItemToggleModalRedux
                        id='channelNotificationPreferences'
                        show={channel.type !== Constants.DM_CHANNEL && !isArchived}
                        modalId={ModalIdentifiers.CHANNEL_NOTIFICATIONS}
                        dialogType={ChannelNotificationsModal}
                        dialogProps={{
                            channel,
                            currentUser: user,
                        }}
                        text={localizeMessage('navbar.preferences', 'Notification Preferences')}
                    />
                    <MenuItemToggleMuteChannel
                        id='channelToggleMuteChannel'
                        user={user}
                        channel={channel}
                        isMuted={isMuted}
                        isArchived={isArchived}
                    />
                </Menu.Group>

                <Menu.Group divider={divider}>
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[channelMembersPermission]}
                    >
                        <Menu.ItemToggleModalRedux
                            id='channelAddMembers'
                            show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && !isArchived && !isDefault && !isGroupConstrained}
                            modalId={ModalIdentifiers.CHANNEL_INVITE}
                            dialogType={ChannelInviteModal}
                            dialogProps={{channel}}
                            text={localizeMessage('navbar.addMembers', 'Add Members')}
                        />
                        <Menu.ItemToggleModalRedux
                            id='channelAddMembers'
                            show={channel.type === Constants.GM_CHANNEL && !isArchived && !isGroupConstrained}
                            modalId={ModalIdentifiers.CREATE_DM_CHANNEL}
                            dialogType={MoreDirectChannels}
                            dialogProps={{isExistingChannel: true}}
                            text={localizeMessage('navbar.addMembers', 'Add Members')}
                        />
                    </ChannelPermissionGate>
                    <MenuItemOpenMembersRHS
                        id='channelViewMembers'
                        channel={channel}
                        show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && (isArchived || isDefault)}
                        text={localizeMessage('channel_header.viewMembers', 'View Members')}
                    />
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[channelMembersPermission]}
                    >
                        <Menu.ItemToggleModalRedux
                            id='channelAddGroups'
                            show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && !isArchived && !isDefault && isGroupConstrained && isLicensedForLDAPGroups}
                            modalId={ModalIdentifiers.ADD_GROUPS_TO_CHANNEL}
                            dialogType={AddGroupsToChannelModal}
                            text={localizeMessage('navbar.addGroups', 'Add Groups')}
                        />
                        <Menu.ItemToggleModalRedux
                            id='channelManageGroups'
                            show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && !isArchived && !isDefault && isGroupConstrained && isLicensedForLDAPGroups}
                            modalId={ModalIdentifiers.MANAGE_CHANNEL_GROUPS}
                            dialogType={ChannelGroupsManageModal}
                            dialogProps={{channelID: channel.id}}
                            text={localizeMessage('navbar_dropdown.manageGroups', 'Manage Groups')}
                        />
                        <MenuItemOpenMembersRHS
                            id='channelManageMembers'
                            channel={channel}
                            show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && !isArchived && !isDefault}
                            text={localizeMessage('channel_header.manageMembers', 'Manage Members')}
                            editMembers={!isArchived}
                        />
                    </ChannelPermissionGate>
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[channelMembersPermission]}
                        invert={true}
                    >
                        <MenuItemOpenMembersRHS
                            id='channelViewMembers'
                            channel={channel}
                            show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && !isArchived && !isDefault}
                            text={localizeMessage('channel_header.viewMembers', 'View Members')}
                        />
                    </ChannelPermissionGate>
                </Menu.Group>

                <Menu.Group divider={divider}>
                    <Menu.ItemToggleModalRedux
                        id='channelEditHeader'
                        show={(channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL) && !isArchived && !isReadonly}
                        modalId={ModalIdentifiers.EDIT_CHANNEL_HEADER}
                        dialogType={EditChannelHeaderModal}
                        dialogProps={{channel}}
                        text={localizeMessage('channel_header.setConversationHeader', 'Edit Conversation Header')}
                    />
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[channelPropertiesPermission]}
                    >
                        <Menu.ItemToggleModalRedux
                            id='channelEditHeader'
                            show={channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL && !isArchived && !isReadonly}
                            modalId={ModalIdentifiers.EDIT_CHANNEL_HEADER}
                            dialogType={EditChannelHeaderModal}
                            dialogProps={{channel}}
                            text={localizeMessage('channel_header.setHeader', 'Edit Channel Header')}
                        />
                        <Menu.ItemToggleModalRedux
                            id='channelEditPurpose'
                            show={!isArchived && !isReadonly && channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL}
                            modalId={ModalIdentifiers.EDIT_CHANNEL_PURPOSE}
                            dialogType={EditChannelPurposeModal}
                            dialogProps={{channel}}
                            text={localizeMessage('channel_header.setPurpose', 'Edit Channel Purpose')}
                        />
                        <Menu.ItemToggleModalRedux
                            id='channelRename'
                            show={!isArchived && channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL}
                            modalId={ModalIdentifiers.RENAME_CHANNEL}
                            dialogType={RenameChannelModal}
                            dialogProps={{channel}}
                            text={localizeMessage('channel_header.rename', 'Rename Channel')}
                        />
                    </ChannelPermissionGate>
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[Permissions.CONVERT_PUBLIC_CHANNEL_TO_PRIVATE]}
                    >
                        <Menu.ItemToggleModalRedux
                            id='channelConvertToPrivate'
                            show={!isArchived && !isDefault && channel.type === Constants.OPEN_CHANNEL}
                            modalId={ModalIdentifiers.CONVERT_CHANNEL}
                            dialogType={ConvertChannelModal}
                            dialogProps={{
                                channelId: channel.id,
                                channelDisplayName: channel.display_name,
                            }}
                            text={localizeMessage('channel_header.convert', 'Convert to Private Channel')}
                        />
                    </ChannelPermissionGate>
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[channelDeletePermission]}
                    >
                        <Menu.ItemToggleModalRedux
                            id='channelArchiveChannel'
                            show={!isArchived && !isDefault && channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL}
                            modalId={ModalIdentifiers.DELETE_CHANNEL}
                            className='MenuItem__dangerous'
                            dialogType={DeleteChannelModal}
                            dialogProps={{
                                channel,
                                penultimateViewedChannelName,
                            }}
                            text={localizeMessage('channel_header.delete', 'Archive Channel')}
                        />
                    </ChannelPermissionGate>
                    {isMobile &&
                        <MobileChannelHeaderPlug
                            channel={channel}
                            isDropdown={true}
                        />}
                    <MenuItemLeaveChannel
                        id='channelLeaveChannel'
                        channel={channel}
                        isDefault={isDefault}
                        isGuestUser={isGuest(user.roles)}
                    />
                    <MenuItemCloseMessage
                        id='channelCloseMessage'
                        channel={channel}
                        currentUser={user}
                    />
                    <MenuItemCloseChannel
                        id='channelCloseChannel'
                        isArchived={isArchived}
                    />
                </Menu.Group>
                <Menu.Group>
                    {pluginItems}
                </Menu.Group>
                <Menu.Group divider={divider}>
                    <ChannelPermissionGate
                        channelId={channel.id}
                        teamId={channel.team_id}
                        permissions={[channelUnarchivePermission]}
                    >
                        <Menu.ItemToggleModalRedux
                            id='channelUnarchiveChannel'
                            show={isArchived && !isDefault && channel.type !== Constants.DM_CHANNEL && channel.type !== Constants.GM_CHANNEL}
                            modalId={ModalIdentifiers.UNARCHIVE_CHANNEL}
                            dialogType={UnarchiveChannelModal}
                            dialogProps={{
                                channel,
                            }}
                            text={localizeMessage('channel_header.unarchive', 'Unarchive Channel')}
                        />
                    </ChannelPermissionGate>
                </Menu.Group>
            </React.Fragment>
        );
    }
}
