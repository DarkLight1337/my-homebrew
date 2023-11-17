import { amuletOfBahamut } from './amulet-of-bahamut.mjs';
import { channelDivinity } from './channel-divinity.mjs';
import { kiFueledAncestry } from './ki-fueled-ancestry.mjs';
import { kiFueledBreath } from './ki-fueled-breath.mjs';

const AmuletOfBahamut = Object.assign(amuletOfBahamut, {
    ChannelDivinity: channelDivinity,
    KiFueledAncestry: kiFueledAncestry,
    KiFueledBreath: kiFueledBreath,
});

export default AmuletOfBahamut;
