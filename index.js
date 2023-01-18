require('dotenv').config()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const config = require('./config.json');
const { Player } = require('discord-player');
const { ActivityType, EmbedBuilder } = require('discord.js');

const client = new Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

//console.log(client.commands);

const player = new Player(client);

player.on('error', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.on('connectionError', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.on('trackStart', (queue, track) => {
  queue.metadata.send(`▶ | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`);
});

player.on('trackAdd', (queue, track) => {
  queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
});

player.on('botDisconnect', queue => {
  queue.metadata.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
});

player.on('channelEmpty', queue => {
  queue.metadata.send('❌ | Nobody is in the voice channel, leaving...');
});

player.on('queueEnd', queue => {
  queue.metadata.send('✅ | Queue finished!');
});

client.once('ready', async () => {
  console.log('Ready!');
});

function dailyQuote() {
  const channel = client.channels.cache.get('1063408083298168852')
  let now = new Date();
  let sixPM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  let timeUntil6PM = sixPM.getTime() - now.getTime();
  if (timeUntil6PM < 0) {
    timeUntil6PM += 86400000; // 86400000 is the number of milliseconds in a day
  }
  setTimeout(async () => {
    let response = await fetch('https://self-boost-quotes-api.vercel.app/')
    let data = await response.json()
    const quoteEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Daily Quote')
      .setDescription(data.message)

    channel.send({ embeds: [quoteEmbed] })
    setInterval(async () => {
      let response = await fetch('https://self-boost-quotes-api.vercel.app/')
      let data = await response.json()
      const quoteEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Daily Quote')
        .setDescription(data.message)
      channel.send({ embeds: [quoteEmbed] })
    }, 86400000)
  }, timeUntil6PM)
}

client.on('ready', function () {
  client.user.setPresence({
    activities: [{ name: config.activity, type: Number(config.activityType) }],
    status: Discord.PresenceUpdateStatus.Online,
  });
  dailyQuote()
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
    await message.guild.commands
      .set(client.commands)
      .then(() => {
        message.reply('Deployed!');
      })
      .catch(err => {
        message.reply('Could not deploy commands! Make sure the bot has the application.commands permission!');
        console.error(err);
      });
  }
});

client.on('interactionCreate', async interaction => {
  const command = client.commands.get(interaction.commandName.toLowerCase());

  try {
    if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo') {
      command.execute(interaction, client);
    } else {
      command.execute(interaction, player);
    }
  } catch (error) {
    console.error(error);
    interaction.followUp({
      content: 'There was an error trying to execute that command!',
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
