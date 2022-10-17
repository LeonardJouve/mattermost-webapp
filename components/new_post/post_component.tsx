// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {MouseEvent, useEffect, useRef, useState} from 'react';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';

import {Posts} from 'mattermost-redux/constants/index';
import {
    isMeMessage as checkIsMeMessage,
    isPostPendingOrFailed,
} from 'mattermost-redux/utils/post_utils';

import Constants, {A11yCustomEventTypes, AppEvents, Locations} from 'utils/constants';
import * as PostUtils from 'utils/post_utils';

import {Post} from '@mattermost/types/posts';
import {Emoji} from '@mattermost/types/emojis';
import {PostPluginComponent} from 'types/store/plugins';

import FileAttachmentListContainer from 'components/file_attachment_list';
import OverlayTrigger from 'components/overlay_trigger';
import Tooltip from 'components/tooltip';
import PostProfilePicture from 'components/post_profile_picture';
import FailedPostOptions from 'components/post_view/failed_post_options';
import PostAriaLabelDiv from 'components/post_view/post_aria_label_div';
import PostTime from 'components/post_view/post_time';
import ReactionList from 'components/post_view/reaction_list';
import MessageWithAdditionalContent from 'components/message_with_additional_content';
import InfoSmallIcon from 'components/widgets/icons/info_small_icon';
import PostPreHeader from 'components/post_view/post_pre_header';
import EditPost from 'components/edit_post';
import AutoHeightSwitcher, {AutoHeightSlots} from 'components/common/auto_height_switcher';
import {Props as TimestampProps} from 'components/timestamp/timestamp';
import ThreadFooter from 'components/threading/channel_threads/thread_footer';

import PostBodyAdditionalContent from 'components/post_view/post_body_additional_content/post_body_additional_content';

import PostMessageContainer from 'components/post_view/post_message_view';

import PostUserProfile from './user_profile';
import PostOptions from './post_options';

export type Props = {
    post: Post;
    teamId: string;
    currentUserId: string;
    compactDisplay?: boolean;
    colorizeUsernames?: boolean;
    isFlagged: boolean;
    isBusy?: boolean;
    previewCollapsed?: string;
    previewEnabled?: boolean;
    isEmbedVisible?: boolean;
    enableEmojiPicker?: boolean;
    enablePostUsernameOverride?: boolean;
    isReadOnly?: boolean;
    pluginPostTypes?: {[postType: string]: PostPluginComponent};
    channelIsArchived?: boolean;
    isConsecutivePost?: boolean;
    isLastPost?: boolean;
    recentEmojis: Emoji[];
    handleCardClick?: (post: Post) => void;
    togglePostMenu?: (opened: boolean) => void;
    a11yIndex?: number;
    isBot: boolean;
    hasReplies?: boolean;
    isFirstReply?: boolean;
    previousPostIsComment?: boolean;
    matches?: string[];
    term?: string;
    isMentionSearch?: boolean;
    actions: {
        markPostAsUnread: (post: Post, location: string) => void;
        emitShortcutReactToLastPostFrom: (emittedFrom: 'CENTER' | 'RHS_ROOT' | 'NO_WHERE') => void;
        setActionsMenuInitialisationState: (viewed: Record<string, boolean>) => void;
        selectPost: (post: Post) => void;
        removePost: (post: Post) => void;
    };
    timestampProps?: Partial<TimestampProps>;
    shouldHighlight?: boolean;
    isPostBeingEdited?: boolean;
    isCollapsedThreadsEnabled?: boolean;
    isMobileView: boolean;
};

const PostComponent = (props: Props): JSX.Element => {
    const postRef = useRef<HTMLDivElement>(null);
    const postHeaderRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState(false);
    const [a11yActive, setA11y] = useState(false);
    const [dropdownOpened, setDropdownOpened] = useState(false);
    const [fileDropdownOpened, setFileDropdownOpened] = useState(false);
    const [fadeOutHighlight, setFadeOutHighlight] = useState(false);
    const [alt, setAlt] = useState(false);

    if (props.shouldHighlight) {
        setTimeout(() => {
            setFadeOutHighlight(true);
        }, Constants.PERMALINK_FADEOUT);
    }

    useEffect(() => {
        if (postRef.current) {
            postRef.current.addEventListener(A11yCustomEventTypes.ACTIVATE, handleA11yActivateEvent);
            postRef.current.addEventListener(A11yCustomEventTypes.DEACTIVATE, handleA11yDeactivateEvent);
        }
        if (a11yActive) {
            postRef.current?.dispatchEvent(new Event(A11yCustomEventTypes.UPDATE));
        }
    }, []);

    useEffect(() => {
        if (hover) {
            removeKeyboardListeners();
        }

        if (postRef.current) {
            postRef.current.removeEventListener(A11yCustomEventTypes.ACTIVATE, handleA11yActivateEvent);
            postRef.current.removeEventListener(A11yCustomEventTypes.DEACTIVATE, handleA11yDeactivateEvent);
        }
    }, [hover]);

    const hasSameRoot = (props: Props) => {
        const post = props.post;

        if (props.isFirstReply) {
            return false;
        } else if (!post.root_id && !props.previousPostIsComment && props.isConsecutivePost) {
            return true;
        } else if (post.root_id) {
            return true;
        }

        return false;
    };

    const getClassName = (post: Post, isSystemMessage: boolean, isMeMessage: boolean) => {
        const hovered =
            fileDropdownOpened || dropdownOpened || a11yActive || isPostBeingEdited;
        return classNames('a11y__section post', {
            'post--highlight': props.shouldHighlight && !fadeOutHighlight,
            'same--root': hasSameRoot(props),
            'post--bot': PostUtils.isFromBot(post),
            'post--pinned-or-flagged-highlight': props.shouldHighlight && (post.is_pinned || props.isFlagged),
            'post--editing': props.isPostBeingEdited,
            'current--user': props.currentUserId === post.user_id,
            'post--system': isSystemMessage || isMeMessage,
            'post--root': props.hasReplies,
            'post--comment': post.root_id && post.root_id.length > 0,
            'post--compact': props.compactDisplay,
            'post--hovered': hovered,
            'same--user': props.isConsecutivePost,
            'cursor--pointer': alt && !props.channelIsArchived,
            'post--hide-controls': post.failed || post.state === Posts.POST_DELETED,
            'post--comment same--root': PostUtils.fromAutoResponder(post),
            'post--pinned-or-flagged': post.is_pinned || props.isFlagged,
        });
    };

    const handleAlt = (e: KeyboardEvent) => {
        if (alt !== e.altKey) {
            setAlt(e.altKey);
        }
    };

    const handleFileDropdownOpened = (open: boolean) => setFileDropdownOpened(open);

    const handleDropdownOpened = (opened: boolean) => {
        if (props.togglePostMenu) {
            props.togglePostMenu(opened);
        }
        setDropdownOpened(opened);
    };

    const setsHover = (e: MouseEvent<HTMLDivElement>) => {
        setHover(true);
        setAlt(e.altKey);
        addKeyboardListeners();
    };

    const unsetHover = () => {
        setHover(false);
        setAlt(false);
        removeKeyboardListeners();
    };

    const addKeyboardListeners = () => {
        document.addEventListener('keydown', handleAlt);
        document.addEventListener('keyup', handleAlt);
    };

    const removeKeyboardListeners = () => {
        document.removeEventListener('keydown', handleAlt);
        document.removeEventListener('keyup', handleAlt);
    };

    const handleA11yActivateEvent = () => setA11y(true);

    const handleA11yDeactivateEvent = () => setA11y(false);

    const handlePostClick = (e: MouseEvent<HTMLDivElement>) => {
        if (props.channelIsArchived) {
            return;
        }

        if (e.altKey) {
            props.actions.markPostAsUnread(props.post, 'RHS_COMMENT');
        }
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.preventDefault();

        if (!post) {
            return;
        }
        props.actions.selectPost(post);
    };

    const {
        post,
        isPostBeingEdited,
    } = props;

    const isSystemMessage = PostUtils.isSystemMessage(post);
    const isMeMessage = checkIsMeMessage(post);
    const postClass = classNames('post__body', {'post--edited': PostUtils.isEdited(props.post)});

    let visibleMessage = null;

    if (isSystemMessage && props.isBot) {
        visibleMessage = (
            <span className='post__visibility'>
                <FormattedMessage
                    id='post_info.message.visible'
                    defaultMessage='(Only visible to you)'
                />
            </span>
        );
    } else if (isSystemMessage) {
        visibleMessage = (
            <span className='post__visibility'>
                <FormattedMessage
                    id='post_info.message.visible'
                    defaultMessage='(Only visible to you)'
                />
            </span>
        );
    }

    const message = (props.matches && props.matches.length > 0) || props.isMentionSearch || (props.term && props.term.length > 0) ? (
        <PostBodyAdditionalContent
            post={post}
            options={{
                searchTerm: props.term,
                searchMatches: props.matches,
            }}
        >
            <PostMessageContainer
                post={post}
                options={{
                    searchTerm: props.term,
                    searchMatches: props.matches,
                    mentionHighlight: props.isMentionSearch,
                }}
                isRHS={true}
            />
        </PostBodyAdditionalContent>
    ) : (
        <MessageWithAdditionalContent
            post={post}
            previewCollapsed={props.previewCollapsed}
            previewEnabled={props.previewEnabled}
            isEmbedVisible={props.isEmbedVisible}
            pluginPostTypes={props.pluginPostTypes}
        />
    );

    const showSlot = isPostBeingEdited ? AutoHeightSlots.SLOT2 : AutoHeightSlots.SLOT1;
    const threadFooter = props.isCollapsedThreadsEnabled && !post.root_id && (props.hasReplies || post.is_following) ? <ThreadFooter threadId={post.id}/> : null;

    return (
        <PostAriaLabelDiv
            ref={postRef}
            role='listitem'
            id={'rhsPost_' + post.id}
            tabIndex={-1}
            post={post}
            className={getClassName(post, isSystemMessage, isMeMessage)}
            onClick={handlePostClick}
            onMouseOver={setsHover}
            onMouseLeave={unsetHover}
            data-a11y-sort-order={props.a11yIndex}
        >
            <PostPreHeader
                isFlagged={props.isFlagged}
                isPinned={post.is_pinned}
                channelId={post.channel_id}
            />
            <div
                role='application'
                className='post__content'
            >
                <div className='post__img'>
                    <PostProfilePicture
                        compactDisplay={props.compactDisplay}
                        isBusy={props.isBusy}
                        isRHS={true}
                        post={post}
                        userId={post.user_id}
                    />
                </div>
                <div>
                    <div
                        className='post__header'
                        ref={postHeaderRef}
                    >
                        <PostUserProfile {...props}/>
                        <div className='col'>
                            {
                                <PostTime
                                    isPermalink={!(Posts.POST_DELETED === post.state || isPostPendingOrFailed(post))}
                                    eventTime={post.create_at}
                                    postId={post.id}
                                    location={Locations.RHS_COMMENT}
                                    timestampProps={{...props.timestampProps, style: props.isConsecutivePost && !props.compactDisplay ? 'narrow' : undefined}}
                                />
                            }
                            {post.props && post.props.card &&
                                <OverlayTrigger
                                    delayShow={Constants.OVERLAY_TIME_DELAY}
                                    placement='top'
                                    overlay={
                                        <Tooltip>
                                            <FormattedMessage
                                                id='post_info.info.view_additional_info'
                                                defaultMessage='View additional info'
                                            />
                                        </Tooltip>
                                    }
                                >
                                    <button
                                        className='card-icon__container icon--show style--none'
                                        onClick={(e) => {
                                            e.preventDefault();
                                            props.handleCardClick?.(props.post);
                                        }}
                                    >
                                        <InfoSmallIcon
                                            className='icon icon__info'
                                            aria-hidden='true'
                                        />
                                    </button>
                                </OverlayTrigger>
                            }
                            {visibleMessage}
                        </div>
                        {!isPostBeingEdited &&
                            <PostOptions
                                {...props}
                                setActionsMenuInitialisationState={props.actions.setActionsMenuInitialisationState}
                                handleDropdownOpened={handleDropdownOpened}
                                handleCommentClick={handleCommentClick}
                                hover={hover}
                                removePost={props.actions.removePost}
                            />
                        }
                    </div>
                    <div className={postClass} >
                        {post.failed && <FailedPostOptions post={props.post}/>}
                        <AutoHeightSwitcher
                            showSlot={showSlot}
                            shouldScrollIntoView={isPostBeingEdited}
                            slot1={message}
                            slot2={<EditPost/>}
                            onTransitionEnd={() => document.dispatchEvent(new Event(AppEvents.FOCUS_EDIT_TEXTBOX))}
                        />
                        {post.file_ids && post.file_ids.length > 0 &&
                        <FileAttachmentListContainer
                            post={post}
                            compactDisplay={props.compactDisplay}
                            handleFileDropdownOpened={handleFileDropdownOpened}
                        />
                        }
                        <ReactionList
                            post={post}
                        />
                        {threadFooter}
                    </div>
                </div>
            </div>
        </PostAriaLabelDiv>
    );
};

export default PostComponent;
