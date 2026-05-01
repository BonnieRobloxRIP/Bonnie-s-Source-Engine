# = SPAWN ZONE =
execute as @a[tag=!lobby, tag=!easy, tag=!medium, tag=!hard, tag=!extreme, tag=!training, tag=!endless] at @s run tp @s 0 86 -16
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s add lobby
# // set player for the lobby enviroment
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove easy
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove easy_music
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove easytunnel1
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove easytunnel2
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove easytunnel3
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove easylift
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove medium
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove hard
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove extreme
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove training
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove endless
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove endlesslift
execute as @a[x=0, y=86, z=-16, dx=0, dy=0, dz=0] at @s run tag @s remove endlesstunnel

