otcSwapIdl = {
  "address": "DBHmndyfN4j7BtQsLaCR1SPd7iAXaf1ezUicDs3pUXS8",
  "metadata": {
    "name": "otc_swap",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "burn_sbtc",
      "discriminator": [
        231,
        223,
        186,
        82,
        254,
        198,
        150,
        232
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "squad_multisig"
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "zbtc_mint"
        },
        {
          "name": "sbtc_mint",
          "writable": true
        },
        {
          "name": "user_zbtc_account",
          "writable": true
        },
        {
          "name": "user_sbtc_account",
          "writable": true
        },
        {
          "name": "treasury_zbtc_vault",
          "writable": true
        },
        {
          "name": "fee_vault",
          "writable": true
        },
        {
          "name": "treasury_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "fee_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "authorized_zbtc_pyth_feed",
          "relations": [
            "config"
          ]
        },
        {
          "name": "authorized_sbtc_oracle_state_pda",
          "relations": [
            "config"
          ]
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "sbtc_amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "squad_multisig",
          "writable": true,
          "signer": true
        },
        {
          "name": "sbtc_mint",
          "writable": true
        },
        {
          "name": "zbtc_mint"
        },
        {
          "name": "sbtc_mint_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  98,
                  116,
                  99,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "treasury_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "fee_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "treasury_zbtc_vault"
        },
        {
          "name": "fee_vault"
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fee_rate_bps",
          "type": "u64"
        },
        {
          "name": "min_collateral_bps",
          "type": "u64"
        },
        {
          "name": "authorized_zbtc_pyth_feed",
          "type": "pubkey"
        },
        {
          "name": "authorized_sbtc_oracle_state_pda",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "mint_sbtc",
      "discriminator": [
        21,
        209,
        47,
        40,
        174,
        156,
        10,
        25
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "squad_multisig"
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "zbtc_mint"
        },
        {
          "name": "sbtc_mint",
          "writable": true
        },
        {
          "name": "user_zbtc_account",
          "writable": true
        },
        {
          "name": "user_sbtc_account",
          "writable": true
        },
        {
          "name": "treasury_zbtc_vault",
          "writable": true
        },
        {
          "name": "fee_vault",
          "writable": true
        },
        {
          "name": "sbtc_mint_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  98,
                  116,
                  99,
                  95,
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "treasury_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "fee_authority_pda",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  95,
                  118,
                  49
                ]
              },
              {
                "kind": "account",
                "path": "squad_multisig"
              }
            ]
          }
        },
        {
          "name": "authorized_zbtc_pyth_feed",
          "relations": [
            "config"
          ]
        },
        {
          "name": "authorized_sbtc_oracle_state_pda",
          "relations": [
            "config"
          ]
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "zbtc_amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    }
  ],
  "events": [
    {
      "name": "BurnEvent",
      "discriminator": [
        33,
        89,
        47,
        117,
        82,
        124,
        238,
        250
      ]
    },
    {
      "name": "InitializedEvent",
      "discriminator": [
        136,
        202,
        63,
        120,
        152,
        146,
        41,
        79
      ]
    },
    {
      "name": "MintEvent",
      "discriminator": [
        197,
        144,
        146,
        149,
        66,
        164,
        95,
        16
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidFeeRate",
      "msg": "Fee rate must be 5% or less"
    },
    {
      "code": 6001,
      "name": "InvalidCollateralRatio",
      "msg": "Collateral ratio must be at least 10%"
    },
    {
      "code": 6002,
      "name": "InvalidMintAuthority",
      "msg": "sBTC mint must have Squad as initial authority"
    },
    {
      "code": 6003,
      "name": "InvalidFreezeAuthority",
      "msg": "sBTC mint must have Squad or no freeze authority"
    },
    {
      "code": 6004,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6005,
      "name": "InvalidZbtcMint",
      "msg": "Invalid zBTC mint"
    },
    {
      "code": 6006,
      "name": "InvalidSbtcMint",
      "msg": "Invalid sBTC mint"
    },
    {
      "code": 6007,
      "name": "InvalidTokenAccountOwner",
      "msg": "Invalid token account owner"
    },
    {
      "code": 6008,
      "name": "InvalidTokenMint",
      "msg": "Invalid token mint"
    },
    {
      "code": 6009,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6010,
      "name": "Paused",
      "msg": "Protocol paused"
    },
    {
      "code": 6011,
      "name": "InsufficientLiquidity",
      "msg": "Insufficient liquidity"
    },
    {
      "code": 6012,
      "name": "InsufficientCollateral",
      "msg": "Insufficient collateral"
    },
    {
      "code": 6013,
      "name": "InvalidSquadMultisig",
      "msg": "Invalid squad multisig"
    },
    {
      "code": 6014,
      "name": "InvalidTreasuryVault",
      "msg": "Invalid treasury vault"
    },
    {
      "code": 6015,
      "name": "InvalidFeeVault",
      "msg": "Invalid fee vault"
    },
    {
      "code": 6016,
      "name": "InvalidTokenOwner",
      "msg": "Invalid token owner"
    },
    {
      "code": 6017,
      "name": "PythError",
      "msg": "Pyth oracle error"
    },
    {
      "code": 6018,
      "name": "InvalidPythAccount",
      "msg": "Invalid Pyth account"
    },
    {
      "code": 6019,
      "name": "InvalidOracleAccount",
      "msg": "Invalid oracle account"
    },
    {
      "code": 6020,
      "name": "InvalidOracleData",
      "msg": "Invalid oracle data"
    },
    {
      "code": 6021,
      "name": "StaleOraclePrice",
      "msg": "Stale price data"
    },
    {
      "code": 6022,
      "name": "InvalidPrice",
      "msg": "Invalid price value"
    },
    {
      "code": 6023,
      "name": "HighConfidence",
      "msg": "High confidence interval - unreliable data"
    }
  ],
  "types": [
    {
      "name": "BurnEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "sbtc_burned",
            "type": "u64"
          },
          {
            "name": "zbtc_redeemed",
            "type": "u64"
          },
          {
            "name": "fee_amount",
            "type": "u64"
          },
          {
            "name": "zbtc_price_cents",
            "type": "u64"
          },
          {
            "name": "sbtc_price_cents",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "squad_multisig",
            "type": "pubkey"
          },
          {
            "name": "sbtc_mint",
            "type": "pubkey"
          },
          {
            "name": "zbtc_mint",
            "type": "pubkey"
          },
          {
            "name": "treasury_zbtc_vault",
            "type": "pubkey"
          },
          {
            "name": "fee_vault",
            "type": "pubkey"
          },
          {
            "name": "fee_rate_bps",
            "type": "u64"
          },
          {
            "name": "min_collateral_bps",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "sbtc_decimals",
            "type": "u8"
          },
          {
            "name": "zbtc_decimals",
            "type": "u8"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "total_sbtc_outstanding",
            "type": "u128"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "authorized_zbtc_pyth_feed",
            "type": "pubkey"
          },
          {
            "name": "authorized_sbtc_oracle_state_pda",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "InitializedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "squad_multisig",
            "type": "pubkey"
          },
          {
            "name": "sbtc_mint",
            "type": "pubkey"
          },
          {
            "name": "zbtc_mint",
            "type": "pubkey"
          },
          {
            "name": "treasury_vault",
            "type": "pubkey"
          },
          {
            "name": "fee_vault",
            "type": "pubkey"
          },
          {
            "name": "fee_rate_bps",
            "type": "u64"
          },
          {
            "name": "min_collateral_bps",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "sbtc_mint_authority",
            "type": "pubkey"
          },
          {
            "name": "treasury_vault_authority",
            "type": "pubkey"
          },
          {
            "name": "fee_vault_authority",
            "type": "pubkey"
          },
          {
            "name": "authorized_zbtc_pyth_feed",
            "type": "pubkey"
          },
          {
            "name": "authorized_sbtc_oracle_state_pda",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "MintEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "zbtc_deposited",
            "type": "u64"
          },
          {
            "name": "sbtc_minted",
            "type": "u128"
          },
          {
            "name": "fee_amount",
            "type": "u64"
          },
          {
            "name": "zbtc_price_cents",
            "type": "u64"
          },
          {
            "name": "sbtc_price_cents",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
}
window.otcSwapIdl = otcSwapIdl;
