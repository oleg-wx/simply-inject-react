import { Inject, Injectable, StaticKey } from 'injections';
import { useEffect } from 'react';

export const NAME_GETTER = new StaticKey<NameGetter>('NAME_GETTER');

export interface NameGetter {
  getName(value: unknown): string;
}

export abstract class Formatter {
  abstract format(value: string): string;
}

@Injectable()
export class FormatterUppercase extends Formatter {
  format(value: string): string {
    return value.toUpperCase();
  }
}

@Injectable()
export class FormatterLowercase extends Formatter {
  format(value: string): string {
    return value.toLowerCase();
  }
}

export abstract class NameService {
  abstract getName(): Promise<unknown>;
}

export const NAME_URL = new StaticKey<string>('NAMES_URL');

@Injectable()
export class RandomNameService {
  private readonly _cacheDelayMs = 18000;
  private _cachedName?: string;
  private _wait?: Promise<string>;

  constructor(
    protected formatter: Formatter,
    @Inject(NAME_GETTER) private nameGetter: NameGetter,
    @Inject(NAME_URL) private url: string
  ) {}

  async getName(): Promise<string> {
    if (this._wait) return this._wait;

    this._wait = this._getName();

    // this._wait.then(() => {
    //   this._wait = undefined;
    // });

    return this._wait;
  }

  private async _getName(): Promise<string> {
    if (this._cachedName) return this._cachedName;
    const response = await fetch(this.url, { cache: 'force-cache' });
    const value = await response.json();
    const name = this.nameGetter.getName(value.results[0].name);

    this._cachedName = name;
    this.clearCache();

    return this.formatter.format(name);
  }

  private clearCache() {
    setTimeout(() => {
      this._cachedName = undefined;
    }, this._cacheDelayMs);
  }
}

export function useEffectAsync(callback: () => Promise<void | (() => void | undefined)>, deps?: any[]) {
  if (deps && !Array.isArray(deps)) {
    throw new Error('deps must be an array');
  }
  useEffect(() => {
    var res = callback();
    return () => {
      res?.then &&
        res.then((e) => {
          if (typeof e === 'function') {
            e();
          }
        });
    };
  }, deps);
}
