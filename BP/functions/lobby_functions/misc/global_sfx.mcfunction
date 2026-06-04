# // These get triggered from any point of the map whenever needed. can be heard anywhere by anyone
# = explosion =
execute if score explosion lobby matches 1 run playsound sfx.ambiance.distant_explosion.1 @a
execute if score explosion lobby matches 2 run playsound sfx.ambiance.distant_explosion.2 @a
execute if score explosion lobby matches 3 run playsound sfx.ambiance.distant_explosion.3 @a
execute if score explosion lobby matches 4 run playsound sfx.ambiance.distant_explosion.4 @a
execute if score explosion lobby matches 5 run playsound sfx.ambiance.distant_explosion.5 @a
execute if score explosion lobby matches 6 run playsound sfx.ambiance.distant_explosion.6 @a
execute if score explosion lobby matches 1.. run scoreboard players reset explosion lobby
# = metal creaking =
execute if score metal lobby matches 1 run playsound sfx.ambiance.metal.1 @a
execute if score metal lobby matches 2 run playsound sfx.ambiance.metal.2 @a
execute if score metal lobby matches 3 run playsound sfx.ambiance.metal.3 @a
execute if score metal lobby matches 4 run playsound sfx.ambiance.metal.4 @a
execute if score metal lobby matches 5 run playsound sfx.ambiance.metal.5 @a
execute if score metal lobby matches 5 run playsound sfx.ambiance.metal.6 @a
execute if score metal lobby matches 5 run playsound sfx.ambiance.metal.7 @a
execute if score metal lobby matches 1.. run scoreboard players reset metal lobby