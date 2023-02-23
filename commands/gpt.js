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
            const completions = await client.openai.createCompletion({
                model: 'text-davinci-003',
                prompt: prompt,
                max_tokens: 1024,
                temperature: 0.7,
            });

            const message = completions.data.choices[0].text.trim();

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
