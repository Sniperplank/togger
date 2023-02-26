const { GuildMember, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    name: 'joke',
    description: 'Send a random joke!',
    async execute(interaction, player) {
        await interaction.deferReply();
        let response = await fetch('https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun?type=single')
        let data = await response.json()
        const jokeEmbed = new EmbedBuilder()
            .setColor(0xfff200)
            .setTitle(`A ${data.category} Joke:`)
            .setDescription(data.joke)

        await interaction.followUp({ embeds: [jokeEmbed] })
    },
};
