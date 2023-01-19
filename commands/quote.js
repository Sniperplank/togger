const {GuildMember, EmbedBuilder} = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
  name: 'quote',
  description: 'Send a random quote!',
  async execute(interaction, player) {
    let response = await fetch('https://self-boost-quotes-api.vercel.app/')
    let data = await response.json()
    const quoteEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Quote')
      .setDescription(data.message)

    await interaction.channel.send({ embeds: [quoteEmbed] })
  },
};
