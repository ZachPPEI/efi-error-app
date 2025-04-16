$(document).ready(function() {
    // Store original EZLYNK help content on page load
    const ezlynkSections = [
        'ezlynkWifiIssueContent', 'ezlynkConnectionIssueContent', 'ezlynkEcmBootContent',
        'ezlynkFirmwareUpdateContent', 'ezlynkTuneInstallContent', 'ezlynkTechnicianLinkContent'
    ];
    const originalEzlynkContent = {};
    ezlynkSections.forEach(section => {
        originalEzlynkContent[section] = $(`#${section}`).html();
    });

    // Store the original description text, with a fallback
    const originalDescription = $('.description').length ? $('.description').html() : "Resolve EFILive errors efficiently—enter your code, access expert solutions, and download files to maintain peak performance for your truck. Developed by PPEI’s experienced professionals.";
    console.log("Original description:", originalDescription);

    // Start in normal mode
    $('body').removeClass('asshole-mode');

    // Define expandable sections with specific header selectors
    const expandableSections = [
        { parent: 'efiErrorCodes', header: '#efiErrorCodes > h3', content: 'efiContent' },
        { parent: 'additionalInfo', header: '#additionalInfo > h3', content: 'additionalContent' },
        { parent: 'ezlynkInfo', header: '#ezlynkInfo > h3', content: 'ezlynkContent' },
        { parent: 'truckBox', header: '#truckBox > h2', content: 'truckInfo' },
        { parent: 'additionalResourcesEFI', header: '#additionalResourcesEFI > h4', content: 'resourcesContentEFI' },
        { parent: 'additionalResourcesHP', header: '#additionalResourcesHP > h4', content: 'resourcesContentHP' },
        { parent: 'ezlynkWifiIssue', header: '#ezlynkWifiIssue > h4', content: 'ezlynkWifiIssueContent' },
        { parent: 'ezlynkConnectionIssue', header: '#ezlynkConnectionIssue > h4', content: 'ezlynkConnectionIssueContent' },
        { parent: 'ezlynkEcmBoot', header: '#ezlynkEcmBoot > h4', content: 'ezlynkEcmBootContent' },
        { parent: 'ezlynkFirmwareUpdate', header: '#ezlynkFirmwareUpdate > h4', content: 'ezlynkFirmwareUpdateContent' },
        { parent: 'ezlynkTuneInstall', header: '#ezlynkTuneInstall > h4', content: 'ezlynkTuneInstallContent' },
        { parent: 'ezlynkTechnicianLink', header: '#ezlynkTechnicianLink > h4', content: 'ezlynkTechnicianLinkContent' }
    ];

    // Bind click events to specific headers
    expandableSections.forEach(({ parent, header, content }) => {
        $(header).off('click'); // Remove existing handlers
        $(header).click((event) => {
            event.stopPropagation(); // Prevent bubbling
            toggleSection(parent, content);
        });
    });

    // Handle form submission for error code search
    $('#errorForm').submit(function(event) {
        event.preventDefault();
        const code = $('#error_code').val().trim();
        const $efiSection = $('#efiErrorCodes');
        const $resultContainer = $('#resultContainer');
        const $turboHud = $('#turboHud');
        const $turboLogo = $('.turbo-logo');

        // Set loading text based on mode
        const humorText = $('body').hasClass('asshole-mode') ? [
            "Analyzing your bullshit... Hold on!",
            "Decoding your fuckup... This’ll take a sec!",
            "Processing your crap... Lucky I’m here!",
            "Scanning your mess... What a disaster!"
        ] : [
            "Analyzing ECM... Smarter Than Your Buddy’s ‘Tuner’!",
            "Decoding Issues... Like a Mechanic With a Cheat Code!",
            "Processing ECM... Your Scan Tool’s Got Nothing on This!",
            "Scanning Errors... Faster Than a Boost Leak Fix!"
        ];
        $('.turbo-text').text(humorText[Math.floor(Math.random() * humorText.length)]);

        console.log("Form submitted, showing turbo-hud");
        $turboHud.addClass('active');

        if (!$efiSection.hasClass('expanded')) {
            toggleSection('efiErrorCodes', 'efiContent');
        }

        $turboLogo.addClass('spinning');
        console.log("Animation started");

        setTimeout(() => {
            console.log("Spin animation completed, triggering AJAX");
            $turboLogo.removeClass('spinning');
            $.post('/submit', { error_code: code }, function(data) {
                console.log("AJAX success, hiding turbo-hud");
                console.log("Response:", data);
                $('#error_code').val(data.error_code.replace('$', ''));
                $resultContainer.empty();
                $turboHud.addClass('exiting');
                setTimeout(() => $turboHud.removeClass('active exiting'), 500);

                // Toggle mode based on response
                if (data.asshole_mode) {
                    console.log("Switching to or maintaining asshole mode");
                    $('body').addClass('asshole-mode');
                } else {
                    console.log("Switching to normal mode");
                    $('body').removeClass('asshole-mode');
                }

                // Always render the result or error message, even if updateEzlynkHelp fails
                if (data.result) {
                    console.log("Rendering result:", data.result);
                    const fileDisplayNames = $('body').hasClass('asshole-mode') ? {
                        "18-21 Cummins Bypass Install Instructions.pdf": "Bypass cable crap",
                        "PPEI_BBX.bbx": "PPEI BBX Shit",
                        "program autocal step by step.pdf": "AutoCal Fix Guide",
                        "https://youtu.be/1s3yqm-zAgw?si=QlFq8De5Npggs31o": "Watch This, Idiot",
                        "lb7 and lly's.docx": "LB7/LLY Fuse Bullshit"
                    } : {
                        "18-21 Cummins Bypass Install Instructions.pdf": "Bypass cable instructions",
                        "PPEI_BBX.bbx": "PPEI BBX File",
                        "program autocal step by step.pdf": "Program AutoCal Guide",
                        "https://youtu.be/1s3yqm-zAgw?si=QlFq8De5Npggs31o": "YouTube Tutorial",
                        "lb7 and lly's.docx": "LB7/LLY Fuse Guide"
                    };
                    const filesHtml = data.result.files && data.result.files.length 
                        ? '<ul>' + data.result.files.map(file => 
                            file.startsWith('http') 
                                ? `<li><a href="${file}" target="_blank">${fileDisplayNames[file] || 'YouTube Tutorial'}</a></li>` 
                                : `<li><a href="/download/Files/${file}" title="${file}">${fileDisplayNames[file] || file}</a></li>`
                          ).join('') + '</ul>' 
                        : $('body').hasClass('asshole-mode') ? 'None, you’re screwed' : 'None';
                    $resultContainer.html(`
                        <div class="result">
                            <h2>Error: ${data.error_code}</h2>
                            <p><strong>Description:</strong> ${data.result.description}</p>
                            <p><strong>Cause:</strong> ${data.result.cause}</p>
                            <p><strong>Action:</strong> ${data.result.action.replace(/\n/g, '<br>')}</p>
                            <p><strong>Files:</strong> ${filesHtml}</p>
                            ${data.result.grok_note ? `<p><em>${data.result.grok_note}</em></p>` : ''}
                        </div>
                    `);
                } else {
                    console.log("No result found, displaying message:", data.message);
                    // Display the error message in a styled div for consistency
                    const errorMessage = data.message || 'Error: Something went wrong. Try again, genius.';
                    $resultContainer.html(`
                        <div class="result">
                            <p>${errorMessage}</p>
                        </div>
                    `);
                }

                $('#supportLink').attr('href', `mailto:zach@ppei.com?subject=PPEI%20Error%20Code%20Help&body=Hi%20PPEI%20team,%20I%20can’t%20find%20my%20error%20code%20(${data.error_code}).%20Can%20you%20help${$('body').hasClass('asshole-mode') ? ', assholes?' : '?'}`);

                // Update EZLYNK help and description, with error handling
                try {
                    updateEzlynkHelp(data.asshole_mode);
                } catch (e) {
                    console.error("Error in updateEzlynkHelp:", e);
                }

                preserveExpandedStates();
            }, 'json').fail(function(jqXHR, textStatus, errorThrown) {
                console.log("AJAX failed, hiding turbo-hud");
                console.log("Error:", textStatus, errorThrown);
                $turboHud.addClass('exiting');
                setTimeout(() => {
                    $turboHud.removeClass('active exiting');
                    $resultContainer.html($('body').hasClass('asshole-mode') ? '<p>Error loading result, you incompetent fuck!</p>' : '<p>Error loading result. Try again, gearhead!</p>');
                    preserveExpandedStates();
                }, 500);
            });
        }, 2000);
    });
});

// Toggle expandable sections
function toggleSection(sectionId, contentId) {
    const $section = $(`#${sectionId}`);
    const $content = $(`#${contentId}`);
    const isExpanded = $section.hasClass('expanded');

    if (isExpanded) {
        // Collapsing the section
        $content.removeClass('expanded').css('max-height', '0');
        $section.removeClass('expanded');
    } else {
        // Expanding the section
        $content.addClass('expanded').css('max-height', '10000px');
        $section.addClass('expanded');
    }
    // Force a reflow to ensure the transition starts immediately
    void $content[0].offsetHeight;
}

// Reapply max-height to all expanded sections to prevent collapse after DOM updates
function preserveExpandedStates() {
    $('.efi-content.expanded, .additional-content.expanded, .truck-info.expanded, .resources-content.expanded')
        .css('max-height', '10000px');
}

// Update EZLYNK help content and description based on mode (asshole or normal)
function updateEzlynkHelp(isAssholeMode) {
    console.log(isAssholeMode ? "Rewriting EZLYNK help to asshole mode" : "Restoring EZLYNK help to normal mode");
    const ezlynkContent = $('#ezlynkContent');
    const description = $('.description');
    const updates = isAssholeMode ? {
        '#ezlynkWifiIssueContent': `
            <p><strong>Issue:</strong> Your shitty EZLYNK isn’t broadcasting WiFi—big fucking surprise.</p>
            <p><strong>Suggestions, dipshit:</strong></p>
            <ul>
                <li>Unplug the damn thing, wait a minute like it’s your fucking nap time, then plug it back in.</li>
                <li>Check for a blue light—if it’s dead, you’re screwed, moron.</li>
                <li>Look at the OBD-II port for bent pins or crap you left in there.</li>
                <li>Still fucked? Cry to EZLYNK support for a new piece of junk.</li>
            </ul>
        `,
        '#ezlynkConnectionIssueContent': `
            <p><strong>Issue:</strong> You see "EZLYNK_XX" but can’t connect—pathetic.</p>
            <p><strong>Suggestions, genius:</strong></p>
            <ul>
                <li>Ignore the "No Internet" whining—duh, it’s for your truck, not TikTok.</li>
                <li>Restart your phone and the EZLYNK piece of shit.</li>
                <li>Get closer to the truck, you lazy bastard—no signal through your mom’s basement.</li>
                <li>Still nothing? Update the app and stop sucking at this.</li>
            </ul>
        `,
        '#ezlynkEcmBootContent': `
            <p><strong>Issue:</strong> "Can’t talk to ECM"—boo-fucking-hoo.</p>
            <p><strong>Suggestions, asshole:</strong></p>
            <ul>
                <li>Turn the key to "Run" first, you brain-dead fuck—ECM needs to wake up.</li>
                <li>Jam that EZLYNK in the OBD-II port right, dipshit.</li>
                <li>Check for loose cables—don’t fuck it up more.</li>
                <li>Still dead? ECM might be locked—deal with it or bug your tech.</li>
            </ul>
        `,
        '#ezlynkFirmwareUpdateContent': `
            <p><strong>Issue:</strong> Firmware update crapped out—shocker, huh?</p>
            <p><strong>Suggestions, you tool:</strong></p>
            <ul>
                <li>Unplug the EZLYNK junk, wait 30 seconds, then plug it back in.</li>
                <li>Check the firmware version in the app under "About" in "Settings"—if you can even find it.</li>
                <li>If it’s still old, get a decent internet connection and retry, dumbass.</li>
                <li>Still broken? Whine to EZLYNK support.</li>
            </ul>
        `,
        '#ezlynkTuneInstallContent': `
            <p><strong>Issue:</strong> Tune install stuck at 0%—fucking typical.</p>
            <p><strong>Suggestions, loser:</strong></p>
            <ul>
                <li>Your shitty cell data’s to blame—shocking.</li>
                <li>Unplug the EZLYNK, use real WiFi, and grab the tune again from the "Cloud" button.</li>
                <li>Plug it back in and retry, genius.</li>
                <li>Charge your damn battery—low volts fuck this up.</li>
            </ul>
        `,
        '#ezlynkTechnicianLinkContent': `
            <p><strong>Issue:</strong> Can’t link to a tech—poor you.</p>
            <p><strong>Suggestions, jackass:</strong></p>
            <ul>
                <li>Get some fucking internet or data.</li>
                <li>In the app, go to "Vehicle," pick your truck, hit "Technicians," then "Lynk."</li>
                <li>Type the tech’s email—your dealer gave it, you forgetful prick—and list your mods.</li>
                <li>No email? Bitch to your EZLYNK dealer.</li>
            </ul>
        `
    } : {
        '#ezlynkWifiIssueContent': `
            <p><strong>Issue:</strong> The EZLYNK device isn’t broadcasting a WiFi signal (e.g., "EZLYNK_XX"), so you can’t connect via the app.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Unplug the EZLYNK device from the OBD-II port, wait 60 seconds, then plug it back in.</li>
                <li>Check for a blue light on the device—if it’s not lit, the device may be faulty.</li>
                <li>Inspect the OBD-II port for bent pins or debris that might prevent a proper connection.</li>
                <li>If the issue persists, contact EZLYNK support for a potential firmware update or device replacement.</li>
            </ul>
        `,
        '#ezlynkConnectionIssueContent': `
            <p><strong>Issue:</strong> You see the "EZLYNK_XX" network but can’t connect, or it says "Unable to connect."</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Ignore the "No Internet Connection" message on your phone—it’s normal since the EZLYNK network connects to the vehicle, not the internet.</li>
                <li>Restart your phone and the EZLYNK device (unplug and replug into the OBD-II port).</li>
                <li>Ensure you’re within WiFi range (close to the vehicle) and there’s no interference from other networks.</li>
                <li>If the issue persists, update the EZLYNK app to the latest version and retry.</li>
            </ul>
        `,
        '#ezlynkEcmBootContent': `
            <p><strong>Issue:</strong> The EZLYNK app shows "Unable to communicate with your vehicle" when trying to stream data or tune.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Turn the vehicle’s key to the "Run" position (without starting the engine) to boot the ECM before connecting the EZLYNK device.</li>
                <li>Ensure the EZLYNK device is securely plugged into the OBD-II port.</li>
                <li>Check for any loose connections or damaged cables between the device and the port.</li>
                <li>If the issue continues, verify the ECM is not locked (e.g., similar to \`$0333\`) and contact your technician.</li>
            </ul>
        `,
        '#ezlynkFirmwareUpdateContent': `
            <p><strong>Issue:</strong> The EZLYNK device disconnects during a firmware update, leaving it in an unstable state.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Unplug the EZLYNK device from the OBD-II port, wait 30 seconds, then plug it back in.</li>
                <li>Connect to the EZLYNK app and check the firmware version under the "About" page in the "Settings" tab.</li>
                <li>If the firmware didn’t update, ensure a stable internet connection and retry the update.</li>
                <li>Contact EZLYNK support if the device remains unresponsive.</li>
            </ul>
        `,
        '#ezlynkTuneInstallContent': `
            <p><strong>Issue:</strong> When installing a tune via the EZLYNK app, the progress bar stalls at 0%.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>This often happens due to incomplete data downloads over cell data or unstable networks.</li>
                <li>Unplug the EZLYNK device, connect your phone to a stable WiFi network, and fetch the tune profile again via the "Cloud" button in the app.</li>
                <li>Plug the device back in and retry the installation.</li>
                <li>Ensure your vehicle’s battery is charged or connected to a charger, as low voltage can interrupt the process.</li>
            </ul>
        `,
        '#ezlynkTechnicianLinkContent': `
            <p><strong>Issue:</strong> The EZLYNK app fails to link your vehicle with a technician for tune updates or diagnostics.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Ensure you’re connected to the internet or mobile data.</li>
                <li>In the EZLYNK app, go to the "Vehicle" tab, select your vehicle, tap "Technicians," and choose "Lynk."</li>
                <li>Enter the technician’s email address (provided by your dealer) and describe any vehicle modifications.</li>
                <li>If you don’t have the technician’s email, contact your EZLYNK dealer for assistance.</li>
            </ul>
        `
    };

    // Update EZLYNK content
    Object.entries(updates).forEach(([selector, html]) => ezlynkContent.find(selector).html(html));

    // Update description based on mode
    if (isAssholeMode) {
        description.html("Get your pathetic EFILive errors sorted, dipshit—just shove your dumbass code in, snag PPEI’s top-notch fixes, and download what you need to keep your shitty truck from totally fucking up. PPEI’s elite pros built this, because we’re the best—unlike your sorry ass.");
    } else {
        description.html(originalDescription);
    }
}

window.onload = function() {
    if ($('.result').length) {
        toggleSection('efiErrorCodes', 'efiContent');
    }
};