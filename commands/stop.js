const { GuildMember } = require('discord.js');

module.exports = {
  name: 'stop',
  description: 'Stop all songs in the queue!',
  async execute(interaction, player) {
    if (!interaction.member.roles.cache.has('877711181740138538')) {
      return void interaction.reply({
        content: 'You do not have permission to stop!',
        ephemeral: true,
      });
    }
    if (!(interaction.member instanceof GuildMember) || !interaction.member.voice.channel) {
      return void interaction.reply({
        content: 'You are not in a voice channel!',
        ephemeral: true,
      });
    }

    if (
      interaction.guild.members.me.voice.channelId &&
      interaction.member.voice.channelId !== interaction.guild.members.me.voice.channelId
    ) {
      return void interaction.reply({
        content: 'You are not in my voice channel!',
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const queue = player.nodes.get(interaction.guildId);
    if (!queue || !queue.node.isPlaying())
      return void interaction.followUp({
        content: '❌ | No music is being played!',
      });
    queue.delete();
    return void interaction.followUp({ content: '🛑 | Stopped the player!' });
  },
};
