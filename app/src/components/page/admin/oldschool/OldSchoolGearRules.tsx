// src/components/page/public/oldschool/OldSchoolGearRules.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OldSchoolGearRules() {
  return (
    <Card className="border-white/10 bg-[#253649]/70 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl text-zinc-100">Gear Rules</CardTitle>
        <p className="text-sm text-zinc-200/85">
          What is allowed and what is banned — slot by slot.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Core gear rule */}
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="text-sm font-medium text-amber-300">Core rule</p>
          <p className="mt-2 text-sm text-zinc-200/90 leading-relaxed">
            All <span className="text-zinc-100 font-medium">T2</span> gear — whether purchased from
            the store or obtained from raids — is{" "}
            <span className="text-rose-400 font-medium">banned</span>. You must use{" "}
            <span className="text-zinc-100 font-medium">T1</span> gear.
          </p>
        </div>

        {/* Authorized exceptions */}
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          <p className="text-sm font-medium text-zinc-100">Allowed exceptions</p>
          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              The BIS helm / hood is allowed, as well
              as the BIS bow and wand.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span>
                <span className="text-zinc-100">Cape :</span> use the old winter cape if you have it;
                otherwise, use whatever you currently have.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span>
                <span className="text-zinc-100">Omnox</span> and{" "}
                <span className="text-zinc-100">Berserker</span> are allowed as trinkets.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span>
                <span className="text-zinc-100">Seal :</span> use the PvP seal if you have one;
                otherwise, use your summer event seal.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span>
                <span className="text-zinc-100">Focus & planar fragments :</span> no restrictions.
              </span>
            </li>
          </ul>
        </div>

        {/* Banned items */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-zinc-100">Banned items</p>
          <ul className="mt-3 space-y-3 text-sm text-zinc-200/90">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
              No level 65 weapon that provides a healing boost.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Planar weapons</span> are banned — eternal weapons
                remain allowed of course.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
              <span>
                <span className="text-zinc-100">Event jewelry</span> is banned : Autumn Necklace,
                Carnival Earring. Upgraded jewelry is also banned.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
              All other trinkets are banned, in particular those from CoA.
            </li>
          </ul>
        </div>

        {/* Runes */}
        <div className="rounded-xl border border-white/10 bg-[#1F2B3A]/55 p-4">
          <p className="text-sm font-medium text-zinc-100">Runes</p>
          <p className="mt-2 text-sm text-zinc-200/85 leading-relaxed">
            No official restriction on runes. That said, if you have a lot of unused EoA runes, avoid
            placing them on T1 gear — use crafted runes instead if you want to rune your equipment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}