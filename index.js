require('dotenv').config()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const Discord = require('discord.js');
const Client = require('./client/Client');
const config = require('./config.json');
const { Player } = require('discord-player');
const { ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const client = new Client();
client.commands = new Discord.Collection();
client.openai = new OpenAIApi(configuration);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

//console.log(client.commands);

const player = new Player(client);

player.events.on('error', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
});

player.events.on('playerError', (queue, error) => {
  console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

player.events.on('playerStart', (queue, track) => {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('skipButton')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('stopButton')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger),
    );
  const embed = new EmbedBuilder()
    .setColor(0xfff200)
    .setTitle(`Playing: ${track.title}`)
    .setURL(track.url)
    .setDescription(`[0:00 / ${track.duration}]`);

  queue.metadata.send({ embeds: [embed], components: [row] });
});

player.events.on('audioTrackAdd', (queue, track) => {
  queue.metadata.send(`🎶 | Track **${track.title}** queued!`);
});

player.events.on('audioTracksAdd', (queue, tracks) => {
  queue.metadata.send(`🎶 | **${tracks.length}** tracks queued!`);
});

player.events.on('disconnect', queue => {
  queue.metadata.send('❌ | I was manually disconnected from the voice channel, clearing queue!');
});

player.events.on('emptyChannel', queue => {
  queue.metadata.send('❌ | Nobody is in the voice channel, leaving...');
});

player.events.on('emptyQueue', queue => {
  queue.metadata.send('✅ | Queue finished!');
});

client.once('ready', async () => {
  console.log('Ready!');
});

const sendQuote = async () => {
  const channel = client.channels.cache.get('1063408083298168852') // tog general: 863636389730844683 
  let response = await fetch('https://self-boost-quotes-api.vercel.app/')
  let data = await response.json()
  const quoteEmbed = new EmbedBuilder()
    .setColor(0xfff200)
    .setTitle('Daily Quote')
    .setDescription(data.message)
  channel.send({ embeds: [quoteEmbed] });
  scheduleNextQuote();
}

const scheduleNextQuote = () => {
  let today = new Date();
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(21);
  tomorrow.setMinutes(45);
  tomorrow.setSeconds(0);

  let timeUntilNextQuote = tomorrow - today;
  console.log("Time until next quote " + timeUntilNextQuote)
  setTimeout(sendQuote, timeUntilNextQuote);
}

const sendJoke = async () => {
  const channel = client.channels.cache.get('863640879667347456')
  let response = await fetch('https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun?type=single')
  let data = await response.json()
  const jokeEmbed = new EmbedBuilder()
    .setColor(0xfff200)
    .setTitle('Daily Joke')
    .setDescription(data.joke)
  channel.send({ embeds: [jokeEmbed] });
  scheduleNextJoke();
}

const scheduleNextJoke = () => {
  let today = new Date();
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20);
  tomorrow.setMinutes(45);
  tomorrow.setSeconds(0);

  let timeUntilNextJoke = tomorrow - today;
  console.log("Time until next joke " + timeUntilNextJoke)
  setTimeout(sendJoke, timeUntilNextJoke);
}

client.on('ready', function () {
  client.user.setPresence({
    activities: [{ name: config.activity, type: Number(config.activityType) }],
    status: Discord.PresenceUpdateStatus.Online,
  });
  scheduleNextQuote()
  scheduleNextJoke()
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
  if (interaction.isButton()) {
    const skipCommand = client.commands.get('skip');
    const stopCommand = client.commands.get('stop');
    try {
      if (interaction.customId == 'skipButton') {
        skipCommand.execute(interaction, player);
      }
      if (interaction.customId == 'stopButton') {
        stopCommand.execute(interaction, player);
      }
    } catch (error) {
      console.error(error);
      interaction.followUp({
        content: 'Button did not respond!',
      });
    }

  } else {
    const command = client.commands.get(interaction.commandName.toLowerCase());

    try {
      if (interaction.commandName == 'ban' || interaction.commandName == 'userinfo' || interaction.commandName == 'gpt') {
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
  }
});

client.login(process.env.DISCORD_TOKEN);
