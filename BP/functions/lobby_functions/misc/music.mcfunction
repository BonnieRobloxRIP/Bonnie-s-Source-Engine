# = SCORES =
execute as @a[tag=lobby, tag=!music_stop] at @s run scoreboard players remove @s music 1
execute as @a[tag=easy_music, tag=!music_stop] at @s run scoreboard players remove @s music 1
execute as @a[tag=medium_music, tag=!music_stop] at @s run scoreboard players remove @s music 1
execute as @a[tag=hard_music, tag=!music_stop] at @s run scoreboard players remove @s music 1
execute as @a[tag=extreme_music, tag=!music_stop] at @s run scoreboard players remove @s music 1
execute as @a[tag=endless_music, tag=!music_stop] at @s run scoreboard players remove @s music 1
# = STOP MUSIC BEFORE NEW ONE PLAYS =
# // Lobby
execute as @a[tag=lobby, scores={music=..-1}] at @s run stopsound @s music.lobby
# = MUSIC =
# // Lobby
execute as @a[tag=lobby, tag=!music_stop, scores={music=..-1}] at @s run playsound music.lobby @s
execute as @a[tag=lobby, tag=!music_stop, scores={music=..-1}] at @s run scoreboard players set @s music 1726
# // Easy Mode
execute as @a[tag=easy_music, tag=!music_stop, scores={music=..-1}] at @s run playsound music.easygame @s
execute as @a[tag=easy_music, tag=!music_stop, scores={music=..-1}] at @s run scoreboard players set @s music 1828
# // Medium Mode
execute as @a[tag=medium_music, tag=!music_stop, scores={music=..-1}] at @s run playsound music.mediumgame @s
execute as @a[tag=medium_music, tag=!music_stop, scores={music=..-1}] at @s run scoreboard players set @s music 6614
# // Hard Mode
execute as @a[tag=hard_music, tag=!music_stop, scores={music=..-1}] at @s run playsound music.hardgame @s
execute as @a[tag=hard_music, tag=!music_stop, scores={music=..-1}] at @s run scoreboard players set @s music 2938
# // Extreme Mode
execute as @a[tag=extreme_music, tag=!music_stop, scores={music=..-1}] at @s run playsound music.extremegame @s
execute as @a[tag=extreme_music, tag=!music_stop, scores={music=..-1}] at @s run scoreboard players set @s music 2914
# // Default Minecraft Music
stopsound @a music.game
stopsound @a music.game.creative
# // Disabled Music People
scoreboard players reset @a[tag=music_stop] music
scoreboard players reset @a[tag=!lobby, tag=!easy_music, tag=!medium_music, tag=!hard_music, tag=!extreme_music, tag=!endless_music] music
execute as @a[tag=music_stop] at @s run stopsound @s music.lobby
execute as @a[tag=music_stop] at @s run stopsound @s music.easygame
execute as @a[tag=music_stop] at @s run stopsound @s music.mediumgame
execute as @a[tag=music_stop] at @s run stopsound @s music.hardgame
execute as @a[tag=music_stop] at @s run stopsound @s music.extremegame
# // stop sounds to anyone without these tags
execute as @a[tag=!lobby] at @s run stopsound @s music.lobby
execute as @a[tag=!easy_music, tag=!endless_music] at @s run stopsound @s music.easygame
execute as @a[tag=!medium_music, tag=!endless_music] at @s run stopsound @s music.mediumgame
execute as @a[tag=!hard_music, tag=!endless_music] at @s run stopsound @s music.hardgame
execute as @a[tag=!extreme_music, tag=!endless_music] at @s run stopsound @s music.extremegame


# = ENDLESS MUSIC PICKER =
# - SCORE -
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1}] at @s run scoreboard players random @s lobby 1 4
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=1}] at @s run playsound music.easygame @s
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=1}] at @s run scoreboard players set @s music 1828
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=2}] at @s run playsound music.mediumgame @s
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=2}] at @s run scoreboard players set @s music 6614
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=3}] at @s run playsound music.hardgame @s
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=3}] at @s run scoreboard players set @s music 2938
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=4}] at @s run playsound music.extremegame @s
execute as @a[tag=endless_music, tag=!music_stop, scores={music=..-1, lobby=4}] at @s run scoreboard players set @s music 2914
execute as @a[tag=endless_music, tag=!music_stop, scores={music=1.., lobby=1..}] at @s run scoreboard players reset @s lobby