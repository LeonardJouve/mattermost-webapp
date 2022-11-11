// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

// Group: @interactive_dialog @plugin

import {demoPlugin} from '../../utils/plugins';

describe('Interactive Dialogs', () => {

    cy.task('log', 'start!');
    let testChannel;

    before(() => {
        // # Create a visit a new channel
        cy.task('log', 'Before this...');
        cy.shouldNotRunOnCloudEdition();
        cy.task('log', 'We passed this!');
        cy.shouldHavePluginUploadEnabled();

        cy.apiInitSetup().then(({team, channel}) => {
            testChannel = channel;

            // # Set up Demo plugin
            cy.apiUploadAndEnablePlugin(demoPlugin);

            cy.visit(`/${team.name}/channels/${channel.name}`);
        });
    });
    it('MM-T2503 Boolean value check', () => {
        // # Type /dialog and press Enter
        cy.uiGetPostTextBox().type('/dialog {enter}');

        // * Verify that the interactive dialog modal opens up
        cy.get('#interactiveDialogModal').should('be.visible')

    });
});