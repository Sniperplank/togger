const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gpt',
    description: 'Chat with GPT',
    options: [
        {
            name: 'prompt',
            type: ApplicationCommandOptionType.String,
            description: 'The prompt to send to gpt',
            required: true,
        },
    ],
    async execute(interaction, client) {
        const prompt = interaction.options.getString('prompt');
        await interaction.deferReply();

        try {
            // Generate a response using the GPT-3 API
            const completions = await client.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    { "role": "system", "content": "You are a discord bot that helps the server members with their inquiries" },
                    { "role": "user", "content": prompt }
                ],
            });

            const message = completions.data.choices[0].message.content

            const embed = new EmbedBuilder()
                .setColor(0xfff200)
                .setTitle(prompt)
                .setDescription(message)

            // Send the generated response to the Discord channel
            await interaction.followUp({
                embeds: [embed]
            });
        } catch (error) {
            console.error(error);
            interaction.reply({
                content: `Sorry, I was not able to generate a response.`,
                ephemeral: true,
            });
        }
    },
};
