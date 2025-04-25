const socket = new WebSocket('ws://localhost:8000'); 
let voiceChannels = [];
var users = [];

// Set the initial background color
document.getElementById('colorPicker').addEventListener('input', function () {
    document.body.style.backgroundColor = this.value;
});

socket.onmessage = function(event) {
    // Parse the incoming message
    const data = JSON.parse(event.data);
    // Check if the data is about speaking
    if (data.isSpeaking !== undefined) {
        // List
        const userElement = document.querySelector(`[data-user-id="${data.userId}"]`);
        // Avatars
        const avatarEl = document.querySelector(`[avatar-user-id="${data.userId}"]`);
        if (userElement) {
            if (data.isSpeaking) {
                // List animation
                userElement.classList.add('speaking');
                // avatar animation
                avatarEl.classList.add('userSpeaking');
            } else {
                userElement.classList.remove('speaking');
                avatarEl.classList.remove('userSpeaking');
            }
        }
    } else if (data.voiceChannels) {
        voiceChannels = data.voiceChannels;

        const channelSelect = document.getElementById('channelSelect');
        // Check if channelSelect has a value, if so, save it for later
        const selectedChannelValue = channelSelect.value;
        
        // verify if the channelSelect is empty
        if (channelSelect.options.length > 1) {
            channelSelect.innerHTML = '<option value="">-- Select a Channel --</option>';
        }

        // Populate the channel select dropdown
        voiceChannels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = channel.name;
            channelSelect.appendChild(option);
        });
        //if selectedChannelId is not empty, set it to the channelSelect
        if (selectedChannelValue) {
            channelSelect.value = selectedChannelValue;
        }

        updateUserList(channelSelect);           
    }
};

document.getElementById('channelSelect').addEventListener('change', function() {
    updateUserList(channelSelect);
});

var updateUserList = function(selectedChannelValue) {
   
    const userList = document.getElementById('userList');
    userList.innerHTML = '';           
    
    if (selectedChannelValue) {
        const selectedChannel = voiceChannels.find(channel => channel.id === selectedChannelValue.value);
        //document.getElementById('serverName').innerHTML = selectedChannel.guildname;

        if (selectedChannel) {
            users = selectedChannel.users;
            selectedChannel.users.forEach(user => {
                // Do not show the bot user
                if (user.username === "ReactiveVoicesAvatars") {
                    return;
                }
                const userItem = document.createElement('div');
                userItem.setAttribute('data-user-id', user.id); // Add data-user-id attribute

                
                const div = document.createElement('div');
                div.style.display = 'flex';

                const userImage = document.createElement('img');
                if(user.avatar === null) {
                    userImage.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                } else {
                    userImage.src = user.avatar;
                }
                
                userImage.alt = user.username;
                userImage.style.width = '30px';
                userImage.style.height = '30px';
                userImage.style.borderRadius = '50%';
                userImage.style.marginRight = '10px';
                
                div.appendChild(userImage);
                const userName = document.createElement('span');
                userName.textContent = user.username;
                userName.style.fontSize = '20px';
                userName.style.fontWeight = 'bold';
                userName.style.color = '#000000';
                div.appendChild(userName);
                userItem.appendChild(div);
                
                userItem.className = 'user';                       
                userList.appendChild(userItem);
            });
        // Draw avatars after updating the user list
        drawAvatars();
        }
    }
}

document.getElementById('joinButton').addEventListener('click', () => {
    const selectedChannelId = document.getElementById('channelSelect').value;
    if (selectedChannelId) {
        socket.send(JSON.stringify({ type: 'join', channelId: selectedChannelId }));
    } else {
        alert('Please select a channel to join.');
    }
});

document.getElementById('leaveButton').addEventListener('click', () => {
    socket.send(JSON.stringify({ type: 'leave' }));
});


// Function to draw avatars side by side
function drawAvatars() {
    const avatarView = document.getElementById('AvatarView');
    avatarView.innerHTML = ''; // Clear previous avatars

    users.forEach(user => {
        // Do not show the bot user
        if (user.username === "ReactiveVoicesAvatars") {
            return;
        }
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatar-container';
        avatarContainer.setAttribute('avatar-user-id', user.id); // Add data-user-id attribute

        const avatarImage = document.createElement('img');
        avatarImage.src = user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'; // Default avatar
        avatarImage.alt = user.username;
        avatarImage.className = 'avatar';

        avatarContainer.appendChild(avatarImage);
        avatarView.appendChild(avatarContainer);
    });
}