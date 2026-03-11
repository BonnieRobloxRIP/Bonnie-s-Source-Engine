# = SCORES =
execute as @a[tag=lobby, tag=!music_stop] at @s unless score game lobby matches -1 run scoreboard players add @s music 1
# = PLAY AUDIO =
execute as @a[tag=lobby, scores={music=..2}] at @s run playsound music.lobby.skywars @s
# = RESET =
execute as @a[tag=lobby, scores={music=1845..}] at @s run scoreboard players reset @s music
# = REMOVE =
scoreboard players reset @a[tag=music_stop] music
scoreboard players reset @a[tag=emote_afterbody] music
scoreboard players reset @a[tag=emote_shika] music
scoreboard players reset @a[tag=emote_getdown] music
scoreboard players reset @a[tag=emote_aiduaemve] music
stopsound @a[tag=music_stop] music.lobby.skywars
stopsound @a[tag=music_stop] music.game.skywars