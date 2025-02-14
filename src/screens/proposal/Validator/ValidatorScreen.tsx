import React, { useCallback, useContext } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ImageURISource, ActivityIndicator } from 'react-native';
import { useAssets } from 'expo-asset';
import { setStringAsync } from 'expo-clipboard';
import { Text } from 'react-native-elements';
import { ThemeContext } from 'styled-components/native';
import { exportValidatorURI } from '@config/ServerConfig';
import {
    Enum_Proposal_Status as EnumProposalStatus,
    Enum_Proposal_Type as EnumProposalType,
    Proposal,
    Validator,
} from '~/graphql/generated/generated';
import globalStyle from '~/styles/global';
import ShortButton from '~/components/button/ShortButton';
import Anchor from '~/components/anchor/Anchor';
import getString from '~/utils/locales/STRINGS';
import { getValidatorDateString } from '~/utils/time';
import { VOTE_SELECT } from '~/utils/votera/voterautil';
import { useAppDispatch } from '~/state/hooks';
import { showSnackBar } from '~/state/features/snackBar';
import { getBoaScanUrl, getAgoraScanUrl } from '~/utils/votera/agoraconf';
import { CopyIcon, CloseIcon, PublicKeyIcon, AddressIcon } from '~/components/icons';

const styles = StyleSheet.create({
    anchor: { flex: 1, flexDirection: 'row', marginHorizontal: 10 },
    anchorText: {
        borderBottomColor: 'black',
        borderBottomWidth: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    exportAnchor: {
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 1,
        height: 26,
        justifyContent: 'center',
        marginLeft: 4,
        width: 61,
    },
    exportText: { fontSize: 10 },
    header: { alignItems: 'center', height: 35 },
    headerFirstLine: { alignItems: 'center', flexDirection: 'row' },
    headerNextLine: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
    headerText: { fontSize: 13, marginRight: 5 },
    headerValue: { fontSize: 13, marginLeft: 5 },
    itemBallotAgree: {
        borderRadius: 9,
        borderWidth: 2,
        height: 17,
        marginHorizontal: 7,
        width: 17,
    },
    itemBallotContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
    itemDate: {
        fontSize: 12,
        left: 0,
        lineHeight: 18,
        position: 'absolute',
        textAlign: 'right',
        top: 60,
        width: '100%',
    },
    itemStatus: { fontSize: 13, lineHeight: 18, textAlign: 'right' },
    listHeader: { backgroundColor: 'white', height: 66, width: '100%' },
    listHeaderText: { fontSize: 13, marginHorizontal: 19, marginVertical: 23 },
    moreText: { fontSize: 13, textAlign: 'center' },
    nameColumn: {
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
    },
    nameGlobeRow: { flexDirection: 'row' },
    nameKeyRow: { flexDirection: 'row' },
    rowContainer: {
        backgroundColor: 'white',
        flexDirection: 'row',
        height: 52,
        width: '100%',
    },
    statusColumn: { justifyContent: 'center', width: 140 },
});

function getExportValidatorUrl(proposal: Proposal | undefined) {
    return `${exportValidatorURI}/${proposal?.proposalId || ''}`;
}

const ELLIPSIS_TAIL_SIZE = -10;

function LineComponent(): JSX.Element {
    return <View style={globalStyle.lineComponent} />;
}

interface HeaderProps {
    proposal: Proposal | undefined;
    onRefresh: () => void;
}

function AssessListHeaderComponent(props: HeaderProps): JSX.Element {
    const { onRefresh, proposal } = props;
    const themeContext = useContext(ThemeContext);

    return (
        <View style={[globalStyle.flexRowBetween, styles.listHeader]}>
            <Text style={[globalStyle.rtext, styles.listHeaderText]}>{getString('검증자 평가 현황')}</Text>
            <View style={[globalStyle.flexRowAlignCenter]}>
                <ShortButton
                    title={getString('새로고침')}
                    buttonStyle={globalStyle.shortSmall}
                    titleStyle={{ fontSize: 10 }}
                    onPress={onRefresh}
                />
                <Anchor
                    style={[styles.exportAnchor, { borderColor: themeContext.color.boxBorder }]}
                    source={getExportValidatorUrl(proposal)}
                >
                    <Text style={[globalStyle.btext, styles.exportText, { color: themeContext.color.primary }]}>
                        {getString('내보내기')}
                    </Text>
                </Anchor>
            </View>
        </View>
    );
}

function VoteListHeaderComponent(props: HeaderProps): JSX.Element {
    const { onRefresh, proposal } = props;
    const themeContext = useContext(ThemeContext);

    return (
        <View style={[globalStyle.flexRowBetween, styles.listHeader]}>
            <Text style={[globalStyle.rtext, styles.listHeaderText]}>{getString('검증자 투표 현황')}</Text>
            <View style={[globalStyle.flexRowAlignCenter]}>
                <ShortButton
                    title={getString('새로고침')}
                    buttonStyle={globalStyle.shortSmall}
                    titleStyle={{ fontSize: 10 }}
                    onPress={onRefresh}
                />
                <Anchor
                    style={[styles.exportAnchor, { borderColor: themeContext.color.boxBorder }]}
                    source={getExportValidatorUrl(proposal)}
                >
                    <Text style={[globalStyle.btext, styles.exportText, { color: themeContext.color.primary }]}>
                        {getString('내보내기')}
                    </Text>
                </Anchor>
            </View>
        </View>
    );
}

function ClosedListHeaderComponent(props: HeaderProps): JSX.Element {
    const { proposal, onRefresh } = props;
    const themeContext = useContext(ThemeContext);

    return (
        <View style={[globalStyle.flexRowBetween, styles.listHeader]}>
            <Text style={[globalStyle.rtext, styles.listHeaderText]}>{getString('검증자 투표 결과')}</Text>
            <Anchor
                style={[styles.exportAnchor, { borderColor: themeContext.color.boxBorder }]}
                source={getExportValidatorUrl(proposal)}
            >
                <Text style={[globalStyle.btext, styles.exportText, { color: themeContext.color.primary }]}>
                    {getString('내보내기')}
                </Text>
            </Anchor>
        </View>
    );
}

enum EnumIconAsset {
    Abstain = 0,
}

// eslint-disable-next-line global-require, import/extensions
const iconAssets = [require('@assets/icons/prohibit.png')];

interface SubProps {
    proposal: Proposal | undefined;
}

function PendingValidatorScreen(props: SubProps): JSX.Element {
    const { proposal } = props;
    const themeContext = useContext(ThemeContext);

    return (
        <View style={styles.header}>
            <Text style={[globalStyle.rtext, { fontSize: 13, color: themeContext.color.primary }]}>
                {getString('제안 생성 절차가 완료된 후, 검증자 리스트가 표시됩니다&#46;')}
            </Text>
        </View>
    );
}

interface ValidatorProps {
    proposal: Proposal | undefined;
    onRefresh: () => void;
    total: number;
    participated: number;
    validators: Validator[];
    loading: boolean;
}

function AssessValidatorScreen(props: ValidatorProps): JSX.Element {
    const { total, participated, validators, onRefresh, loading, proposal } = props;
    const themeContext = useContext(ThemeContext);
    const dispatch = useAppDispatch();

    const renderItem = useCallback(
        (item: Validator) => {
            const publicKey = item.publicKey || '';
            const address = item.address || '';
            return (
                <View style={styles.rowContainer}>
                    <View style={styles.nameColumn}>
                        <View style={styles.nameKeyRow}>
                            <PublicKeyIcon />
                            <Anchor style={styles.anchor} source={getAgoraScanUrl(publicKey)}>
                                <Text style={[globalStyle.ltext, styles.anchorText]} numberOfLines={1}>
                                    {publicKey.slice(0, ELLIPSIS_TAIL_SIZE)}
                                </Text>
                                <Text style={[globalStyle.ltext, styles.anchorText]}>
                                    {publicKey.slice(ELLIPSIS_TAIL_SIZE)}
                                </Text>
                            </Anchor>
                            <TouchableOpacity
                                onPress={() => {
                                    setStringAsync(publicKey)
                                        .then(() => {
                                            dispatch(showSnackBar(getString('클립보드에 복사되었습니다')));
                                        })
                                        .catch(console.log);
                                }}
                            >
                                <CopyIcon color={themeContext.color.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.nameGlobeRow}>
                            <AddressIcon />
                            <Anchor style={styles.anchor} source={getBoaScanUrl(address)}>
                                <Text style={[globalStyle.ltext, styles.anchorText]} numberOfLines={1}>
                                    {address.slice(0, ELLIPSIS_TAIL_SIZE)}
                                </Text>
                                <Text style={[globalStyle.ltext, styles.anchorText]}>
                                    {address.slice(ELLIPSIS_TAIL_SIZE)}
                                </Text>
                            </Anchor>
                            <TouchableOpacity
                                onPress={() => {
                                    setStringAsync(address)
                                        .then(() => {
                                            dispatch(showSnackBar(getString('클립보드에 복사되었습니다')));
                                        })
                                        .catch(console.log);
                                }}
                            >
                                <CopyIcon color={themeContext.color.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.statusColumn}>
                        <Text style={[globalStyle.ltext, styles.itemStatus]}>
                            {item.assessUpdate ? getString('평가완료') : getString('미평가')}
                        </Text>
                    </View>
                    {item.assessUpdate && (
                        <Text style={[globalStyle.ltext, styles.itemDate, { color: themeContext.color.textBlack }]}>
                            {getValidatorDateString(item.assessUpdate)}
                        </Text>
                    )}
                </View>
            );
        },
        [themeContext.color.primary, themeContext.color.textBlack, dispatch],
    );

    return (
        <View>
            <View style={styles.header}>
                <View style={styles.headerFirstLine}>
                    <Text style={[globalStyle.rtext, styles.headerText, { color: themeContext.color.primary }]}>
                        {getString('평가에 참여한 검증자 수')}
                    </Text>
                    <Text style={[globalStyle.rtext, styles.headerValue, { color: themeContext.color.primary }]}>
                        {participated}
                    </Text>
                </View>

                <View style={styles.headerNextLine}>
                    <Text style={[globalStyle.rtext, styles.headerText, { color: themeContext.color.primary }]}>
                        {getString('총 검증자 수')}
                    </Text>
                    <Text style={[globalStyle.rtext, styles.headerValue, { color: themeContext.color.primary }]}>
                        {total}
                    </Text>
                </View>
            </View>
            <LineComponent />
            <AssessListHeaderComponent onRefresh={onRefresh} proposal={proposal} />
            {validators.map((validator) => (
                <View key={`assess.${validator.id}`}>
                    {renderItem(validator)}
                    <LineComponent />
                </View>
            ))}
            {loading && <ActivityIndicator />}
            {!loading && total > validators.length && <Text style={[globalStyle.ltext, styles.moreText]}>......</Text>}
        </View>
    );
}

function VoteValidatorScreen(props: ValidatorProps): JSX.Element {
    const { total, participated, validators, onRefresh, loading, proposal } = props;
    const themeContext = useContext(ThemeContext);
    const dispatch = useAppDispatch();

    const renderItem = useCallback(
        (item: Validator) => {
            const publicKey = item.publicKey || '';
            const address = item.address || '';
            return (
                <View style={styles.rowContainer}>
                    <View style={styles.nameColumn}>
                        <View style={styles.nameKeyRow}>
                            <PublicKeyIcon />
                            <Anchor style={styles.anchor} source={getAgoraScanUrl(publicKey)}>
                                <Text style={[globalStyle.ltext, styles.anchorText]} numberOfLines={1}>
                                    {publicKey.slice(0, ELLIPSIS_TAIL_SIZE)}
                                </Text>
                                <Text style={[globalStyle.ltext, styles.anchorText]}>
                                    {publicKey.slice(ELLIPSIS_TAIL_SIZE)}
                                </Text>
                            </Anchor>
                            <TouchableOpacity
                                onPress={() => {
                                    setStringAsync(publicKey)
                                        .then(() => {
                                            dispatch(showSnackBar(getString('클립보드에 복사되었습니다')));
                                        })
                                        .catch(console.log);
                                }}
                            >
                                <CopyIcon color={themeContext.color.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.nameGlobeRow}>
                            <AddressIcon />
                            <Anchor style={styles.anchor} source={getBoaScanUrl(address)}>
                                <Text style={[globalStyle.ltext, styles.anchorText]} numberOfLines={1}>
                                    {address.slice(0, ELLIPSIS_TAIL_SIZE)}
                                </Text>
                                <Text style={[globalStyle.ltext, styles.anchorText]}>
                                    {address.slice(ELLIPSIS_TAIL_SIZE)}
                                </Text>
                            </Anchor>
                            <TouchableOpacity
                                onPress={() => {
                                    setStringAsync(address)
                                        .then(() => {
                                            dispatch(showSnackBar(getString('클립보드에 복사되었습니다')));
                                        })
                                        .catch(console.log);
                                }}
                            >
                                <CopyIcon color={themeContext.color.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.statusColumn}>
                        <Text style={[globalStyle.ltext, styles.itemStatus]}>
                            {item.ballotUpdate ? getString('투표완료') : getString('미투표')}
                        </Text>
                    </View>
                    {item.ballotUpdate && (
                        <Text style={[globalStyle.ltext, styles.itemDate, { color: themeContext.color.textBlack }]}>
                            {getValidatorDateString(item.ballotUpdate)}
                        </Text>
                    )}
                </View>
            );
        },
        [dispatch, themeContext.color.primary, themeContext.color.textBlack],
    );

    return (
        <View>
            <View style={styles.header}>
                <View style={styles.headerFirstLine}>
                    <Text style={[globalStyle.rtext, styles.headerText, { color: themeContext.color.primary }]}>
                        {getString('투표에 참여한 검증자 수')}
                    </Text>
                    <Text style={[globalStyle.rtext, styles.headerValue, { color: themeContext.color.primary }]}>
                        {participated}
                    </Text>
                </View>

                <View style={styles.headerNextLine}>
                    <Text style={[globalStyle.rtext, styles.headerText, { color: themeContext.color.primary }]}>
                        {getString('총 검증자 수')}
                    </Text>
                    <Text style={[globalStyle.rtext, styles.headerValue, { color: themeContext.color.primary }]}>
                        {total}
                    </Text>
                </View>
            </View>
            <LineComponent />
            <VoteListHeaderComponent onRefresh={onRefresh} proposal={proposal} />
            {validators.map((validator) => (
                <View key={`vote.${validator.id}`}>
                    {renderItem(validator)}
                    <LineComponent />
                </View>
            ))}
            {loading && <ActivityIndicator />}
            {!loading && total > validators.length && <Text style={[globalStyle.ltext, styles.moreText]}>......</Text>}
        </View>
    );
}

function ClosedValidatorScreen(props: ValidatorProps): JSX.Element {
    const { total, participated, validators, onRefresh, loading, proposal } = props;
    const themeContext = useContext(ThemeContext);
    const [assets] = useAssets(iconAssets);
    const dispatch = useAppDispatch();

    const showBallotResult = useCallback(
        (choice?: number | null): JSX.Element => {
            if (choice === VOTE_SELECT.YES) {
                return (
                    <View style={styles.itemBallotContainer}>
                        <View style={[styles.itemBallotAgree, { borderColor: themeContext.color.agree }]} />
                        <Text style={[globalStyle.ltext, styles.itemStatus, { color: themeContext.color.agree }]}>
                            {getString('찬성')}
                        </Text>
                    </View>
                );
            }
            if (choice === VOTE_SELECT.NO) {
                return (
                    <View style={styles.itemBallotContainer}>
                        <CloseIcon color={themeContext.color.disagree} />
                        <Text style={[globalStyle.ltext, styles.itemStatus, { color: themeContext.color.disagree }]}>
                            {getString('반대')}
                        </Text>
                    </View>
                );
            }
            return (
                <View style={styles.itemBallotContainer}>
                    {assets && <Image source={assets[EnumIconAsset.Abstain] as ImageURISource} />}
                    <Text style={[globalStyle.ltext, styles.itemStatus, { color: themeContext.color.abstain }]}>
                        {getString('기권')}
                    </Text>
                </View>
            );
        },
        [assets, themeContext.color.abstain, themeContext.color.agree, themeContext.color.disagree],
    );

    const renderItem = useCallback(
        (item: Validator) => {
            const publicKey = item.publicKey || '';
            const address = item.address || '';
            return (
                <View style={styles.rowContainer}>
                    <View style={styles.nameColumn}>
                        <View style={styles.nameKeyRow}>
                            <PublicKeyIcon />
                            <Anchor style={styles.anchor} source={getAgoraScanUrl(publicKey)}>
                                <Text style={[globalStyle.ltext, styles.anchorText]} numberOfLines={1}>
                                    {publicKey.slice(0, ELLIPSIS_TAIL_SIZE)}
                                </Text>
                                <Text style={[globalStyle.ltext, styles.anchorText]}>
                                    {publicKey.slice(ELLIPSIS_TAIL_SIZE)}
                                </Text>
                            </Anchor>
                            <TouchableOpacity
                                onPress={() => {
                                    setStringAsync(publicKey)
                                        .then(() => {
                                            dispatch(showSnackBar(getString('클립보드에 복사되었습니다')));
                                        })
                                        .catch(console.log);
                                }}
                            >
                                <CopyIcon color={themeContext.color.primary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.nameGlobeRow}>
                            <AddressIcon />
                            <Anchor style={styles.anchor} source={getBoaScanUrl(address)}>
                                <Text style={[globalStyle.ltext, styles.anchorText]} numberOfLines={1}>
                                    {address.slice(0, ELLIPSIS_TAIL_SIZE)}
                                </Text>
                                <Text style={[globalStyle.ltext, styles.anchorText]}>
                                    {address.slice(ELLIPSIS_TAIL_SIZE)}
                                </Text>
                            </Anchor>
                            <TouchableOpacity
                                onPress={() => {
                                    setStringAsync(address)
                                        .then(() => {
                                            dispatch(showSnackBar(getString('클립보드에 복사되었습니다')));
                                        })
                                        .catch(console.log);
                                }}
                            >
                                <CopyIcon color={themeContext.color.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.statusColumn}>
                        {item.ballotUpdate ? (
                            showBallotResult(item.choice)
                        ) : (
                            <Text style={[globalStyle.ltext, styles.itemStatus]}>{getString('미투표')}</Text>
                        )}
                    </View>
                    {item.ballotUpdate && (
                        <Text style={[globalStyle.ltext, styles.itemDate, { color: themeContext.color.textBlack }]}>
                            {getValidatorDateString(item.ballotUpdate)}
                        </Text>
                    )}
                </View>
            );
        },
        [themeContext.color.primary, themeContext.color.textBlack, showBallotResult, dispatch],
    );

    return (
        <View>
            <View style={styles.header}>
                <View style={styles.headerFirstLine}>
                    <Text style={[globalStyle.rtext, styles.headerText, { color: themeContext.color.primary }]}>
                        {getString('투표에 참여한 검증자 수')}
                    </Text>
                    <Text style={[globalStyle.rtext, styles.headerValue, { color: themeContext.color.primary }]}>
                        {participated}
                    </Text>
                </View>

                <View style={styles.headerNextLine}>
                    <Text style={[globalStyle.rtext, styles.headerText, { color: themeContext.color.primary }]}>
                        {getString('총 검증자 수')}
                    </Text>
                    <Text style={[globalStyle.rtext, styles.headerValue, { color: themeContext.color.primary }]}>
                        {total}
                    </Text>
                </View>
            </View>
            <LineComponent />
            <ClosedListHeaderComponent onRefresh={onRefresh} proposal={proposal} />
            {assets &&
                validators.map((validator) => (
                    <View key={`closed.${validator.id}`}>
                        {renderItem(validator)}
                        <LineComponent />
                    </View>
                ))}
            {loading && <ActivityIndicator />}
            {!loading && total > validators.length && <Text style={[globalStyle.ltext, styles.moreText]}>......</Text>}
        </View>
    );
}

interface Props {
    onRefresh: () => void;
    proposal: Proposal | undefined;
    total: number;
    participated: number;
    validators: Validator[];
    loading: boolean;
}

function ValidatorScreen(props: Props): JSX.Element {
    const { onRefresh, proposal, total, participated, validators, loading } = props;

    if (!proposal || proposal?.status === EnumProposalStatus.Created) {
        return <PendingValidatorScreen proposal={proposal} />;
    }

    switch (proposal.status) {
        case EnumProposalStatus.PendingAssess:
        case EnumProposalStatus.Assess:
        case EnumProposalStatus.Reject:
            return (
                <AssessValidatorScreen
                    total={total}
                    participated={participated}
                    validators={validators}
                    onRefresh={onRefresh}
                    loading={loading}
                    proposal={proposal}
                />
            );
        case EnumProposalStatus.PendingVote:
            if (proposal.type === EnumProposalType.Business) {
                return (
                    <AssessValidatorScreen
                        total={total}
                        participated={participated}
                        validators={validators}
                        onRefresh={onRefresh}
                        loading={loading}
                        proposal={proposal}
                    />
                );
            }
            return (
                <VoteValidatorScreen
                    total={total}
                    participated={participated}
                    validators={validators}
                    onRefresh={onRefresh}
                    loading={loading}
                    proposal={proposal}
                />
            );
        case EnumProposalStatus.Vote:
            return (
                <VoteValidatorScreen
                    total={total}
                    participated={participated}
                    validators={validators}
                    onRefresh={onRefresh}
                    loading={loading}
                    proposal={proposal}
                />
            );
        case EnumProposalStatus.Closed:
            return (
                <ClosedValidatorScreen
                    total={total}
                    participated={participated}
                    validators={validators}
                    onRefresh={onRefresh}
                    loading={loading}
                    proposal={proposal}
                />
            );
        default:
            return (
                <VoteValidatorScreen
                    total={total}
                    participated={participated}
                    validators={validators}
                    onRefresh={onRefresh}
                    loading={loading}
                    proposal={proposal}
                />
            );
    }
}

export default ValidatorScreen;
